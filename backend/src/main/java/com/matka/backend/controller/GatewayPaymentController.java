package com.matka.backend.controller;

import com.matka.backend.GatewayPayment;
import com.matka.backend.TransactionEntity;
import com.matka.backend.repository.GatewayPaymentRepository;
import com.matka.backend.repository.TransactionRepository;
import com.matka.backend.repository.UserRepository;
import com.matka.backend.repository.PropertiesRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientResponseException;
import java.util.Optional; // Added import for Optional
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/gateway-payments")
public class GatewayPaymentController {
    private static final Logger log = LoggerFactory.getLogger(GatewayPaymentController.class);

    @Autowired
    private GatewayPaymentRepository gatewayPaymentRepository;

    @Autowired
    private PropertiesRepository propertiesRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.matka.backend.service.BalanceService balanceService;

    @Value("${payment.gateway.apikey:}")
    private String paymentGatewayApiKey;

    @Value("${payment.gateway.authEmail:sara1234@gmail.com}")
    private String paymentGatewayAuthEmail;

    @Value("${payment.gateway.mobileNumber:6377382678}")
    private String paymentGatewayMobileNumber;

    private static final String PAYMENT_GATEWAY_URL = "https://primexpay.in/api/payments/create";
    private static final String PAYMENT_CHECK_URL = "https://primexpay.in/api/merchant/check-payin-status";
    private static final String PAYMENT_PAYOUT_URL = "https://primexpay.in/api/merchant/initiate-fund-transfer";
    private static final String PAYMENT_PAYOUT_CHECK_URL = "https://primexpay.in/api/merchant/check-payout-status";

    private String buildCustRef(String mobile, LocalDate date, LocalTime time) {
        if (mobile == null) mobile = "unknown";
        DateTimeFormatter df = DateTimeFormatter.ofPattern("yyyyMMdd");
        DateTimeFormatter tf = DateTimeFormatter.ofPattern("HHmmss");
        String d = date == null ? LocalDate.now().format(df) : date.format(df);
        String t = time == null ? LocalTime.now().format(tf) : time.format(tf);
        return mobile + "-" + d + t;
    }

    private int readMinimumDepositAmount() {
        try {
            var prop = propertiesRepository.findById("minimum_deposit_amount");
            if (prop.isPresent()) {
                String v = prop.get().getValue();
                if (v != null && !v.isBlank()) return Integer.parseInt(v);
            }
        } catch (Exception ex) {
            log.warn("Failed to read minimum_deposit_amount property", ex);
        }
        return 1;
    }

    private int readPayinWaitTimeSec() {
        try {
            var prop = propertiesRepository.findById("payin_wait_time_sec");
            if (prop.isPresent()) {
                String v = prop.get().getValue();
                if (v != null && !v.isBlank()) return Integer.parseInt(v);
            }
        } catch (Exception ex) {
            log.warn("Failed to read payin_wait_time_sec property", ex);
        }
        return 60;
    }
  
    private int readPayoutWaitTimeSec() {
        try {
            var prop = propertiesRepository.findById("payout_wait_time_sec");
            if (prop.isPresent()) {
                String v = prop.get().getValue();
                if (v != null && !v.isBlank()) return Integer.parseInt(v);
            }
        } catch (Exception ex) {
            log.warn("Failed to read payout_wait_time_sec property", ex);
        }
        return 60;
    }

    // Call primexpay check-payin-status API
    private java.util.Map<String,Object> callCheckPayinStatus(String custRef) {
        String resolvedApiKey = paymentGatewayApiKey;
        if (resolvedApiKey == null || resolvedApiKey.isBlank()) {
            resolvedApiKey = System.getenv("PRIMEXPAY_API_KEY_SARA1234");
        }
        if (resolvedApiKey == null || resolvedApiKey.isBlank()) {
            log.warn("Payment gateway API key not configured for check-payin-status");
            return null;
        }

        try {
            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            java.util.Map<String,Object> payload = new java.util.HashMap<>();
            payload.put("authEmail", paymentGatewayAuthEmail);
            payload.put("apiKey", resolvedApiKey);
            payload.put("custRefNo", custRef);

            HttpEntity<java.util.Map<String,Object>> entity = new HttpEntity<>(payload, headers);
            var resp = rest.postForObject(PAYMENT_CHECK_URL, entity, java.util.Map.class);
            if (resp == null) return null;
            return resp;
        } catch (Exception ex) {
            log.error("Failed to call check-payin-status for {}", custRef, ex);
            return null;
        }
    }

    // Call primexpay check-payout-status API
    private java.util.Map<String,Object> callCheckPayoutStatus(String custRefOrTxnId) {
        String resolvedApiKey = paymentGatewayApiKey;
        if (resolvedApiKey == null || resolvedApiKey.isBlank()) {
            resolvedApiKey = System.getenv("PRIMEXPAY_API_KEY_SARA1234");
        }
        if (resolvedApiKey == null || resolvedApiKey.isBlank()) {
            log.warn("Payment gateway API key not configured for check-payout-status");
            return null;
        }

        try {
            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            java.util.Map<String,Object> payload = new java.util.HashMap<>();
            payload.put("authEmail", paymentGatewayAuthEmail);
            payload.put("apiKey", resolvedApiKey);
            // prefer treating input as custRefNo; caller may pass txnId instead if desired
            if (custRefOrTxnId != null && !custRefOrTxnId.isBlank()) payload.put("custRefNo", custRefOrTxnId);

            HttpEntity<java.util.Map<String,Object>> entity = new HttpEntity<>(payload, headers);
            var resp = rest.postForObject(PAYMENT_PAYOUT_CHECK_URL, entity, java.util.Map.class);
            if (resp == null) return null;
            return resp;
        } catch (Exception ex) {
            log.error("Failed to call check-payout-status for {}", custRefOrTxnId, ex);
            return null;
        }
    }

    

    // Request: { "mobileNumber": "...", "amount": 123, "txDate": "yyyy-MM-dd" (optional), "txTime": "HH:mm:ss" (optional) }
    @PostMapping
    public ResponseEntity<?> createAndInitiate(@RequestBody Map<String,Object> req) {
        if (req == null) return ResponseEntity.badRequest().body(Map.of("message","Missing request body"));
        String mobile = req.get("mobileNumber") == null ? null : String.valueOf(req.get("mobileNumber"));
        Integer amount = null;
        try { if (req.get("amount") != null) amount = Integer.parseInt(String.valueOf(req.get("amount"))); } catch (Exception ex) { }

        if (mobile == null || mobile.isBlank() || amount == null) {
            return ResponseEntity.badRequest().body(Map.of("message","mobileNumber and amount are required"));
        }

        int minDeposit = readMinimumDepositAmount();
        if (amount < minDeposit) {
            return ResponseEntity.badRequest().body(Map.of("message","Amount must be >= minimum_deposit_amount","minimum_deposit_amount",minDeposit));
        }

        // parse optional date/time
        LocalDate txDate = null; LocalTime txTime = null;
        try {
            if (req.get("txDate") != null) txDate = LocalDate.parse(String.valueOf(req.get("txDate")));
        } catch (Exception ex) { /* ignore */ }
        try {
            if (req.get("txTime") != null) txTime = LocalTime.parse(String.valueOf(req.get("txTime")));
        } catch (Exception ex) { /* ignore */ }

        String custRef = buildCustRef(mobile, txDate, txTime);

        GatewayPayment gp = new GatewayPayment();
        gp.setCustRefNum(custRef);
        gp.setMobileNumber(mobile);
        gp.setAmount(amount);
        gp.setTxDate(txDate == null ? LocalDate.now() : txDate);
        gp.setTxTime(txTime == null ? LocalTime.now() : txTime);
        gp.setStatus("Pending");

        try {
            gatewayPaymentRepository.save(gp);
        } catch (Exception ex) {
            log.error("Failed to save GatewayPayment", ex);
            return ResponseEntity.status(500).body(Map.of("message","Failed to create payment record"));
        }

        String resolvedApiKey = paymentGatewayApiKey;
        if (resolvedApiKey == null || resolvedApiKey.isBlank()) {
            resolvedApiKey = System.getenv("PRIMEXPAY_API_KEY_SARA1234");
        }
        if (resolvedApiKey == null || resolvedApiKey.isBlank()) {
            gp.setStatus("Fail");
            gatewayPaymentRepository.save(gp);
            log.error("Payment gateway API key not configured (env PRIMEXPAY_API_KEY_SARA1234)");
            return ResponseEntity.status(500).body(Map.of("message","Payment gateway not configured"));
        }

        // call gateway
        try {
            RestTemplate rest = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            java.util.Map<String,Object> payload = new java.util.HashMap<>();
            payload.put("authEmail", paymentGatewayAuthEmail);
            payload.put("amount", amount);
            // Do not expose user's real mobile number to external gateway; send configured gateway number instead
            payload.put("mobileNumber", paymentGatewayMobileNumber == null || paymentGatewayMobileNumber.isBlank() ? mobile : paymentGatewayMobileNumber);
            payload.put("custRefNum", custRef);
            // additional fields required by primexpay
            payload.put("custEmail", "anilsera500@gmail.com");
            String custName = "unknown";
            try {
                var userOpt = userRepository.findByMobileNumber(mobile);
                if (userOpt != null && userOpt.isPresent()) {
                    var u = userOpt.get();
                    if (u.getUsername() != null && !u.getUsername().isBlank()) custName = u.getUsername();
                }
            } catch (Exception ex) {
                log.warn("Failed to fetch user for custName", ex);
            }
            payload.put("custName", custName);
            payload.put("apiKey", resolvedApiKey);

            HttpEntity<java.util.Map<String,Object>> entity = new HttpEntity<>(payload, headers);
            var resp = rest.postForObject(PAYMENT_GATEWAY_URL, entity, java.util.Map.class);

            if (resp == null) {
                gp.setStatus("Fail");
                gatewayPaymentRepository.save(gp);
                return ResponseEntity.status(502).body(Map.of("message","Empty response from payment gateway"));
            }

            // expected response: status, custRefNum, message, amount, upiIntentUrl
            Object statusObj = resp.get("status");
            Object respCust = resp.get("custRefNum");
            Object respAmount = resp.get("amount");
            Object url = resp.get("upiIntentUrl");

            String sStatus = statusObj == null ? null : String.valueOf(statusObj);
            String sCust = respCust == null ? null : String.valueOf(respCust);
            Integer rAmount = null;
            try { if (respAmount != null) rAmount = Integer.parseInt(String.valueOf(respAmount)); } catch (Exception ex) { }

            if (sCust == null || !sCust.equals(custRef) || rAmount == null || rAmount.intValue() != amount) {
                gp.setStatus("Fail");
                gatewayPaymentRepository.save(gp);
                return ResponseEntity.status(502).body(Map.of("message","Gateway response verification failed","gatewayResponse",resp));
            }

            if (sStatus != null && sStatus.equalsIgnoreCase("success")) {
                gatewayPaymentRepository.save(gp);

                // start background checker that waits payment_wait_time_sec and then verifies final status
                try {
                    final String finalCust = custRef;
                    new Thread(() -> {
                        try {
                            int waitSec = readPayinWaitTimeSec();
                            Thread.sleep((long)waitSec * 1000L);

                            var checkResp = callCheckPayinStatus(finalCust);
                            var gpOpt2 = gatewayPaymentRepository.findById(finalCust);
                            if (gpOpt2.isEmpty()) return;
                            var gp2 = gpOpt2.get();

                            if (checkResp == null) {
                                if (gp2.getStatus() == null || !gp2.getStatus().equalsIgnoreCase("success")) {
                                    gp2.setStatus("Fail");
                                    gatewayPaymentRepository.save(gp2);
                                }
                                return;
                            }

                            Object chStatusObj = checkResp.get("status");
                            String chStatus = chStatusObj == null ? null : String.valueOf(chStatusObj);
                            Object chAmountObj = checkResp.get("amount");
                            Double chAmountD = null;
                            try { if (chAmountObj != null) chAmountD = Double.parseDouble(String.valueOf(chAmountObj)); } catch (Exception ex) { }
                            int chAmount = chAmountD == null ? 0 : (int) Math.round(chAmountD.doubleValue());

                            if (chStatus != null && chStatus.equalsIgnoreCase("success") && chAmount == gp2.getAmount()) {
                                // mark success and create transaction if not already created
                                if (gp2.getStatus() == null || !gp2.getStatus().equalsIgnoreCase("success")) {
                                    gp2.setStatus("Success");
                                    gatewayPaymentRepository.save(gp2);

                                    // attempt to create transaction (idempotent)
                                    java.time.OffsetDateTime odt = null;
                                    Object createdAtObj = checkResp.get("createdAt");
                                    String createdAtStr = createdAtObj == null ? null : String.valueOf(createdAtObj);
                                    if (createdAtStr != null) {
                                        try { odt = java.time.OffsetDateTime.parse(createdAtStr); } catch (Exception ex) { odt = null; }
                                    }
                                    java.time.LocalDate txDate1 = odt == null ? java.time.LocalDate.now() : odt.toLocalDate();
                                    java.time.LocalTime txTime1 = odt == null ? java.time.LocalTime.now() : odt.toLocalTime();

                                    java.util.List<TransactionEntity> existing = transactionRepository.findByMobileNumberAndAmountAndInitiatorOrderByIdDesc(
                                            gp2.getMobileNumber(), gp2.getAmount(), "user"
                                    );
                                    boolean createTx = true;
                                    if (existing != null && !existing.isEmpty()) {
                                        TransactionEntity last = existing.get(0);
                                        if (last.getTxDate() != null && last.getTxTime() != null && last.getTxDate().equals(txDate1) && last.getTxTime().equals(txTime1)) {
                                            createTx = false;
                                        }
                                    }

                                    if (createTx) {
                                        TransactionEntity tx = new TransactionEntity();
                                        tx.setMobileNumber(gp2.getMobileNumber());
                                        tx.setAmount(gp2.getAmount());
                                        tx.setTxDate(txDate1);
                                        tx.setTxTime(txTime1);
                                        tx.setInitiator("user");
                                        tx.setStatus("Approved");
                                        tx.setRemarks(String.valueOf(checkResp.get("message")));

                                        TransactionEntity savedTx = transactionRepository.save(tx);
                                        // store transaction id on gateway payment (link)
                                        try {
                                            gp2.setTransactionId(savedTx.getId());
                                            gatewayPaymentRepository.save(gp2);
                                        } catch (Exception ex) { /* ignore */ }

                                        // credit user's balance
                                        var userOpt = userRepository.findByMobileNumber(gp2.getMobileNumber());
                                        if (userOpt.isPresent()) {
                                            var user = userOpt.get();
                                            Integer cur = user.getBalance() == null ? 0 : user.getBalance();
                                            user.setBalance(cur + gp2.getAmount());
                                            balanceService.saveAndNotify(user, "Deposit credited");
                                        }
                                    }
                                }
                            } else {
                                if (gp2.getStatus() == null || !gp2.getStatus().equalsIgnoreCase("success")) {
                                    gp2.setStatus("Fail");
                                    gatewayPaymentRepository.save(gp2);
                                }
                            }
                        } catch (Exception ex) {
                            log.warn("Background payment check failed for {}: {}", finalCust, ex.getMessage());
                        }
                    }).start();
                } catch (Exception ex) {
                    log.warn("Failed to start background payment checker for {}", custRef, ex);
                }

                return ResponseEntity.ok(Map.of("message",resp.get("message"), "custRefNum", custRef, "amount", rAmount, "upiIntentUrl", url));
            } else {
                gp.setStatus("Fail");
                gatewayPaymentRepository.save(gp);
                return ResponseEntity.status(502).body(Map.of("message","Payment gateway returned failure","gatewayResponse",resp));
            }

        } catch (Exception ex) {
            log.error("Payment gateway call failed", ex);
            gp.setStatus("Fail");
            gatewayPaymentRepository.save(gp);
            return ResponseEntity.status(502).body(Map.of("message","Payment gateway call failed","error", ex.getMessage()));
        }
    }

    // Callback endpoint for gateway to notify payment status
    // Expected payload:
    // {
    //   "custRefNum": "REF1122334479688",
    //   "status": "success",
    //   "amount": 101.00,
    //   "message": "Success",
    //   "date": "2024-11-08T09:19:03.431Z"
    // }
    @PostMapping("/callback")
    public ResponseEntity<?> callback(@RequestBody java.util.Map<String,Object> payload) {
        if (payload == null) return ResponseEntity.badRequest().body(Map.of("message","Missing payload"));

        // support both keys custRefNum (payin) and custRefNo (payout)
        String cust = null;
        if (payload.get("custRefNum") != null) cust = String.valueOf(payload.get("custRefNum"));
        if ((cust == null || cust.isBlank()) && payload.get("custRefNo") != null) cust = String.valueOf(payload.get("custRefNo"));
        if (cust == null || cust.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","custRef required"));

        log.info("Received payment callback for custRef {}", cust);

        var gpOpt = gatewayPaymentRepository.findById(cust);
        if (gpOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","GatewayPayment not found for custRefNum: "+cust));

        GatewayPayment gp = gpOpt.get();

        // route to payin or payout handler based on amount sign
        try {
            if (gp.getAmount() != null && gp.getAmount() < 0) {
                return payOutCallback(gp, payload);
            } else {
                return payInCallback(gp, payload);
            }
        } catch (Exception ex) {
            log.error("Callback handling failed for custRef {}", cust, ex);
            return ResponseEntity.status(500).body(Map.of("message","Callback handling failed","error",ex.getMessage()));
        }
    }

    // Helper: handle pay-in callback logic (moved from the main callback endpoint)
    private ResponseEntity<?> payInCallback(GatewayPayment gp, java.util.Map<String,Object> payload) {
        String status = payload.get("status") == null ? null : String.valueOf(payload.get("status"));
        String dateStr = payload.get("date") == null ? null : String.valueOf(payload.get("date"));

        Double amountD = null;
        try { if (payload.get("amount") != null) amountD = Double.parseDouble(String.valueOf(payload.get("amount"))); } catch (Exception ex) { }

        boolean success = status != null && status.equalsIgnoreCase("success");

        // If this GatewayPayment is already marked Success, avoid re-processing
        if (gp.getStatus() != null && gp.getStatus().equalsIgnoreCase("success")) {
            log.info("Pay-in callback received for custRef={} but already processed as Success", gp.getCustRefNum());
            return ResponseEntity.ok(Map.of("message","Already processed","status",gp.getStatus()));
        }

        int callbackAmount = amountD == null ? 0 : (int) Math.round(amountD.doubleValue());

        if (success && callbackAmount == gp.getAmount()) {
            gp.setStatus("Success");
            gatewayPaymentRepository.save(gp);

            // create transaction record and credit user's balance
            try {
                java.time.OffsetDateTime odt = null;
                if (dateStr != null && !dateStr.isBlank()) {
                    try { odt = java.time.OffsetDateTime.parse(dateStr); } catch (Exception ex) { odt = null; }
                }

                java.time.LocalDate txDate = odt == null ? LocalDate.now() : odt.toLocalDate();
                java.time.LocalTime txTime = odt == null ? LocalTime.now() : odt.toLocalTime();

                // avoid duplicate transaction: check if one exists with same mobile, amount and initiator
                java.util.List<TransactionEntity> existing = transactionRepository.findByMobileNumberAndAmountAndInitiatorOrderByIdDesc(
                        gp.getMobileNumber(), gp.getAmount(), "user"
                );
                boolean createTx = true;
                if (existing != null && !existing.isEmpty()) {
                    TransactionEntity last = existing.get(0);
                    if (last.getTxDate() != null && last.getTxTime() != null && last.getTxDate().equals(txDate) && last.getTxTime().equals(txTime)) {
                        createTx = false; // already recorded
                    }
                }

                if (createTx) {
                    TransactionEntity tx = new TransactionEntity();
                    tx.setMobileNumber(gp.getMobileNumber());
                    tx.setAmount(gp.getAmount());
                    tx.setTxDate(txDate);
                    tx.setTxTime(txTime);
                    tx.setInitiator("user");
                    tx.setStatus("Approved");
                    tx.setRemarks(String.valueOf(payload.get("message")));

                    TransactionEntity savedTx = transactionRepository.save(tx);

                    // link transaction id to gateway payment and persist
                    try {
                        gp.setTransactionId(savedTx.getId());
                        gatewayPaymentRepository.save(gp);
                    } catch (Exception e) {
                        log.warn("Failed to persist transactionId on GatewayPayment for custRef {}: {}", gp.getCustRefNum(), e.getMessage());
                    }

                    // credit user's balance
                    var userOpt = userRepository.findByMobileNumber(gp.getMobileNumber());
                    if (userOpt.isPresent()) {
                        var user = userOpt.get();
                        Integer cur = user.getBalance() == null ? 0 : user.getBalance();
                        user.setBalance(cur + gp.getAmount());
                        balanceService.saveAndNotify(user, "Deposit credited");
                    }
                } else {
                    // If we didn't create a new transaction because one already exists, link that existing tx id to the gateway payment
                    if (existing != null && !existing.isEmpty()) {
                        try {
                            TransactionEntity last = existing.get(0);
                            if (last.getId() != null) {
                                gp.setTransactionId(last.getId());
                                gatewayPaymentRepository.save(gp);
                            }
                        } catch (Exception e) {
                            log.warn("Failed to persist existing transactionId on GatewayPayment for custRef {}: {}", gp.getCustRefNum(), e.getMessage());
                        }
                    }
                }

                return ResponseEntity.ok(Map.of("message","Pay-in callback processed","status",gp.getStatus()));
            } catch (Exception ex) {
                log.error("Failed to process pay-in callback success actions", ex);
                return ResponseEntity.status(500).body(Map.of("message","Failed to process pay-in callback","error", ex.getMessage()));
            }
        } else {
            gp.setStatus("Fail");
            gatewayPaymentRepository.save(gp);
            return ResponseEntity.ok(Map.of("message","Pay-in callback marked as Fail","status",gp.getStatus()));
        }
    }

    // Helper: handle pay-out (payout) callback logic
    private ResponseEntity<?> payOutCallback(GatewayPayment gp, java.util.Map<String,Object> payload) {
        // Expected payout webhook keys: custRefNo, status (Completed), amount (string), message, date, txnId, utrNumber
        String status = payload.get("status") == null ? null : String.valueOf(payload.get("status"));
        Object amountObj = payload.get("amount");
        Double amountD = null;
        try { if (amountObj != null) amountD = Double.parseDouble(String.valueOf(amountObj)); } catch (Exception ex) { }
        int respAmount = amountD == null ? 0 : (int) Math.round(amountD.doubleValue());

        boolean completed = status != null && status.equalsIgnoreCase("completed");

        // If already Success, ignore
        if (gp.getStatus() != null && gp.getStatus().equalsIgnoreCase("success")) {
            log.info("Pay-out callback received for custRef={} but already processed as Success", gp.getCustRefNum());
            return ResponseEntity.ok(Map.of("message","Already processed","status",gp.getStatus()));
        }

        // gp.amount is stored negative for payouts
        int expected = Math.abs(gp.getAmount() == null ? 0 : gp.getAmount());

        if (completed && respAmount == expected) {
            gp.setStatus("Success");
            try { gatewayPaymentRepository.save(gp); } catch (Exception e) { log.warn("Failed to save GatewayPayment status success for {}: {}", gp.getCustRefNum(), e.getMessage()); }

            // update linked transaction (if any) to Approved
            try {
                Long tid = gp.getTransactionId();
                if (tid != null) {
                    var txOpt = transactionRepository.findById(tid);
                    if (txOpt.isPresent()) {
                        var tx = txOpt.get();
                        tx.setStatus("Approved");
                        transactionRepository.save(tx);
                    } else {
                        log.warn("No transaction found with id {} linked to gateway payment {}", tid, gp.getCustRefNum());
                    }
                } else {
                    log.warn("GatewayPayment {} has no linked transactionId to update after payout success", gp.getCustRefNum());
                }
            } catch (Exception ex) {
                log.error("Failed to update linked transaction after payout success for {}", gp.getCustRefNum(), ex);
            }

            return ResponseEntity.ok(Map.of("message","Pay-out callback processed","status",gp.getStatus()));
        } else {
            gp.setStatus("Fail");
            try { gatewayPaymentRepository.save(gp); } catch (Exception e) { log.warn("Failed to save GatewayPayment status fail for {}: {}", gp.getCustRefNum(), e.getMessage()); }

            // update transaction to Rejected if Failed
            try {
                Long tid = gp.getTransactionId();
                if (tid != null) {
                    var txOpt = transactionRepository.findById(tid);
                    if (txOpt.isPresent()) {
                        var tx = txOpt.get();
                        tx.setStatus("Rejected");
                        transactionRepository.save(tx);
                        try { refundIfWithdrawal(tx); } catch (Exception e) { log.warn("Refund after payout failure failed for tx {}: {}", tx.getId(), e.getMessage()); }
                    }
                }
            } catch (Exception ex) {
                log.error("Failed to update linked transaction after payout failure for {}", gp.getCustRefNum(), ex);
            }

            return ResponseEntity.ok(Map.of("message","Pay-out callback marked as Fail","status",gp.getStatus()));
        }
    }

    // Check payment status by custRefNum
    // GET /api/gateway-payments/status/{custRef}
    @GetMapping("/status/{custRef}")
    public ResponseEntity<?> checkPaymentStatus(@PathVariable String custRef) {
        if (custRef == null || custRef.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","custRef required"));
        var gpOpt = gatewayPaymentRepository.findById(custRef);
        if (gpOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","GatewayPayment not found for custRefNum: "+custRef));
        var gp = gpOpt.get();
        return ResponseEntity.ok(Map.of(
                "custRefNum", gp.getCustRefNum(),
                "status", gp.getStatus(),
                "amount", gp.getAmount(),
                "mobileNumber", gp.getMobileNumber(),
                "txDate", gp.getTxDate(),
                "txTime", gp.getTxTime()
        ));
    }

    // Create a payout for an approved transaction. This is NOT an API endpoint — it's a helper
    // It will set the transaction status to Processing, create a negative GatewayPayment row,
    // call the primexpay initiate-fund-transfer API with positive amount and beneficiary details
    // from the user record. On success (response status Pending and amount matches) it will
    // mark the GatewayPayment as Pending. On any failure it will mark both GatewayPayment and
    // transaction as Fail.
    public void createPayOut(TransactionEntity tx) {
        if (tx == null) return;

        log.info("createPayOut invoked for tx id={} mobile={} amount={}", tx == null ? null : tx.getId(), tx == null ? null : tx.getMobileNumber(), tx == null ? null : tx.getAmount());

        try {

            int amt = tx.getAmount() == null ? 0 : Math.abs(tx.getAmount());

            // fetch user details
            var userOpt = userRepository.findByMobileNumber(tx.getMobileNumber());
            log.debug("Lookup user for mobile {} returned present={}", tx.getMobileNumber(), userOpt.isPresent());
            if (userOpt.isEmpty()) {
                log.warn("createPayOut: user not found for mobile {}", tx.getMobileNumber());
                tx.setStatus("Rejected");
                transactionRepository.save(tx);
                try { refundIfWithdrawal(tx); } catch (Exception e) { log.warn("Refund for missing user after createPayOut failed for tx {}: {}", tx.getId(), e.getMessage()); }
                return;
            }
            var user = userOpt.get();

            // required beneficiary fields: accountNumber, accountHolderName, ifscCode
            log.debug("createPayOut: user bank details holder='{}' acct='{}' ifsc='{}'", user.getAccountHolderName(), user.getAccountNumber() == null ? "<null>" : "<redacted>", user.getIfscCode());
            if (user.getAccountNumber() == null || user.getAccountNumber().isBlank()
                    || user.getAccountHolderName() == null || user.getAccountHolderName().isBlank()
                    || user.getIfscCode() == null || user.getIfscCode().isBlank()) {
                // save gateway payment record as failed
                GatewayPayment gpFail = new GatewayPayment();
                java.time.LocalDate d = tx.getTxDate() == null ? java.time.LocalDate.now() : tx.getTxDate();
                java.time.LocalTime t = tx.getTxTime() == null ? java.time.LocalTime.now() : tx.getTxTime();
                String custRef = buildCustRef(tx.getMobileNumber(), d, t);
                gpFail.setCustRefNum(custRef);
                gpFail.setMobileNumber(tx.getMobileNumber());
                gpFail.setAmount(-amt); // negative amount for payout record
                gpFail.setTxDate(d);
                gpFail.setTxTime(t);
                gpFail.setStatus("Fail");
                // link to existing transaction id
                try { gpFail.setTransactionId(tx.getId()); } catch (Exception e) { /* ignore */ }
                gatewayPaymentRepository.save(gpFail);
                log.info("createPayOut: saved failed GatewayPayment custRef={} for tx={} because beneficiary missing", custRef, tx.getId());

                tx.setStatus("Rejected");
                transactionRepository.save(tx);
                try { refundIfWithdrawal(tx); } catch (Exception e) { log.warn("Refund after beneficiary missing for tx {} failed: {}", tx.getId(), e.getMessage()); }
                return;
            }

            // create gateway payment record with negative amount (payout)
            java.time.LocalDate d = tx.getTxDate() == null ? java.time.LocalDate.now() : tx.getTxDate();
            java.time.LocalTime t = tx.getTxTime() == null ? java.time.LocalTime.now() : tx.getTxTime();
            String custRef = buildCustRef(tx.getMobileNumber(), d, t);

            GatewayPayment gp = new GatewayPayment();
            gp.setCustRefNum(custRef);
            gp.setMobileNumber(tx.getMobileNumber());
            gp.setAmount(-amt); // negative to indicate payout
            gp.setTxDate(d);
            gp.setTxTime(t);
            gp.setStatus("Processing");
            // link gateway payment to the existing transaction id
            try { gp.setTransactionId(tx.getId()); } catch (Exception e) { /* ignore */ }
            gatewayPaymentRepository.save(gp);
            log.info("createPayOut: created GatewayPayment custRef={} for tx={}", custRef, tx.getId());

            // prepare payload for primexpay (send positive amount)
            String resolvedApiKey = paymentGatewayApiKey;
            if (resolvedApiKey == null || resolvedApiKey.isBlank()) resolvedApiKey = System.getenv("PRIMEXPAY_API_KEY_SARA1234");
            if (resolvedApiKey == null || resolvedApiKey.isBlank()) {
                gp.setStatus("Fail"); gatewayPaymentRepository.save(gp);
                tx.setStatus("Rejected"); transactionRepository.save(tx);
                try { refundIfWithdrawal(tx); } catch (Exception e) { log.warn("Refund after missing apiKey for tx {} failed: {}", tx.getId(), e.getMessage()); }
                return;
            }

            // Attempt to resolve bank name from IFSC using Razorpay IFSC API
            String bankName = null;
            try {
                String ifsc = user.getIfscCode() == null ? "" : user.getIfscCode().trim().toUpperCase();
                log.debug("createPayOut: attempting IFSC lookup for {}", ifsc);
                if (!ifsc.isBlank()) {
                    RestTemplate rtIfsc = new RestTemplate();
                    @SuppressWarnings("unchecked")
                    java.util.Map<String,Object> ifscResp = rtIfsc.getForObject("https://ifsc.razorpay.com/" + ifsc, java.util.Map.class);
                    if (ifscResp != null && ifscResp.get("BANK") != null) {
                        bankName = String.valueOf(ifscResp.get("BANK"));
                        log.debug("createPayOut: IFSC lookup result BANK='{}'", bankName);
                    } else {
                        log.debug("createPayOut: IFSC lookup returned empty or no BANK for {}", ifsc);
                    }
                }
            } catch (Exception ex) {
                log.warn("Failed to lookup bank name for IFSC {}: {}", user.getIfscCode(), ex.getMessage());
            }

            java.util.Map<String,Object> payload = new java.util.HashMap<>();
            payload.put("authEmail", paymentGatewayAuthEmail);
            payload.put("apiKey", resolvedApiKey);
            // amount must be numeric (not a string) — send as integer
            payload.put("amount", amt);
            payload.put("custRefNo", custRef);
            if (bankName != null) payload.put("bankName", bankName);

            java.util.Map<String,Object> beneficiary = new java.util.HashMap<>();
            beneficiary.put("name", user.getAccountHolderName());
            beneficiary.put("accountNumber", user.getAccountNumber());
            beneficiary.put("ifscCode", user.getIfscCode());
            // include bankName inside beneficiary as primexpay requires it
            beneficiary.put("bankName", bankName == null ? "" : bankName);

            payload.put("beneficiary", beneficiary);

            // call payout API
            try {
                RestTemplate rest = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

                // Serialize payload to JSON explicitly to avoid Jackson attempting to walk entity proxies
                String jsonPayload = null;
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    mapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
                    jsonPayload = mapper.writeValueAsString(payload);
                    log.debug("Payout JSON payload for custRef {}: {}", custRef, jsonPayload);
                } catch (Exception ex) {
                    log.error("Payout API call failed for custRef {}: {}", custRef, ex);
                    gp.setStatus("Fail");
                    try { gp.setTransactionId(tx.getId()); } catch (Exception e) { /* ignore */ }
                    gatewayPaymentRepository.save(gp);
                    tx.setStatus("Rejected");
                    transactionRepository.save(tx);
                    try { refundIfWithdrawal(tx); } catch (Exception e) { log.warn("Refund after payout api call failure failed for tx {}: {}", tx.getId(), e.getMessage()); }
                    return;
                }

                HttpEntity<?> entity = (jsonPayload != null) ? new HttpEntity<>(jsonPayload, headers) : new HttpEntity<>(payload, headers);
                log.info("Calling payout API for custRef {} (tx={})", custRef, tx.getId());
                try {
                    var resp = rest.postForObject(PAYMENT_PAYOUT_URL, entity, java.util.Map.class);
                    log.debug("Payout API response for custRef {}: {}", custRef, resp);
                    if (resp == null) {
                        log.warn("Payout API returned empty response for custRef {}", custRef);
                        gp.setStatus("Fail"); gatewayPaymentRepository.save(gp);
                        tx.setStatus("Rejected"); transactionRepository.save(tx);
                        try { refundIfWithdrawal(tx); } catch (Exception e) { log.warn("Refund after empty payout response failed for tx {}: {}", tx.getId(), e.getMessage()); }
                        return;
                    }

                    Object successObj = resp.get("success");
                    boolean succ = false;
                    try { if (successObj != null) succ = Boolean.parseBoolean(String.valueOf(successObj)); } catch (Exception ex) { succ = false; }

                    Object respStatusObj = resp.get("status");
                    String respStatus = respStatusObj == null ? null : String.valueOf(respStatusObj);
                    Object respAmountObj = resp.get("amount");
                    Double respAmountD = null;
                    try { if (respAmountObj != null) respAmountD = Double.parseDouble(String.valueOf(respAmountObj)); } catch (Exception ex) { }
                    int respAmount = respAmountD == null ? 0 : (int) Math.round(respAmountD.doubleValue());

                    Object respCustObj = resp.get("custRefNo");
                    String respCust = respCustObj == null ? null : String.valueOf(respCustObj);

                    if (succ && respAmount == amt && respCust != null && respCust.equals(custRef)) {
                        log.info("Payout API accepted payout and returned Pending for custRef {}", custRef);
                        gp.setStatus("Pending");
                        try { gp.setTransactionId(tx.getId()); } catch (Exception e) { /* ignore */ }
                        gatewayPaymentRepository.save(gp);

                        // start background checker for payout finalization (wait payment_wait_time_sec)
                        try {
                            final String finalCust = custRef;
                            final Long linkedTxId = tx.getId();
                            final int expectedAmt = amt;
                            new Thread(() -> {
                                try {
                                    int waitSec = readPayoutWaitTimeSec();
                                    Thread.sleep((long) waitSec * 1000L);

                                    var checkResp = callCheckPayoutStatus(finalCust);
                                    var gpOpt2 = gatewayPaymentRepository.findById(finalCust);
                                    if (gpOpt2.isEmpty()) return;
                                    var gp2 = gpOpt2.get();

                                    if (checkResp == null) {
                                        log.warn("Payout final check returned null for custRef {}", finalCust);
                                        if (gp2.getStatus() == null || !gp2.getStatus().equalsIgnoreCase("success")) {
                                            gp2.setStatus("Fail");
                                            gatewayPaymentRepository.save(gp2);
                                        }
                                        if (linkedTxId != null) {
                                            try {
                                                var txOpt2 = transactionRepository.findById(linkedTxId);
                                                if (txOpt2.isPresent()) {
                                                    var tx2 = txOpt2.get();
                                                    tx2.setStatus("Rejected");
                                                    transactionRepository.save(tx2);
                                                    try { refundIfWithdrawal(tx2); } catch (Exception e) { log.warn("Refund in background finalizer failed for tx {}: {}", tx2.getId(), e.getMessage()); }
                                                }
                                            } catch (Exception e) { log.warn("Failed to mark transaction fail for id {}: {}", linkedTxId, e.getMessage()); }
                                        }
                                        return;
                                    }

                                    Object chStatusObj = checkResp.get("status");
                                    String chStatus = chStatusObj == null ? null : String.valueOf(chStatusObj);
                                    Object chAmountObj = checkResp.get("amount");
                                    Double chAmountD = null;
                                    try { if (chAmountObj != null) chAmountD = Double.parseDouble(String.valueOf(chAmountObj)); } catch (Exception ex) { }
                                    int chAmount = chAmountD == null ? 0 : (int) Math.round(chAmountD.doubleValue());

                                    if (chStatus != null && chStatus.equalsIgnoreCase("completed") && chAmount == expectedAmt) {
                                        gp2.setStatus("Success");
                                        gatewayPaymentRepository.save(gp2);
                                        if (linkedTxId != null) {
                                            try {
                                                var txOpt2 = transactionRepository.findById(linkedTxId);
                                                if (txOpt2.isPresent()) {
                                                    var tx2 = txOpt2.get();
                                                    tx2.setStatus("Approved");
                                                    transactionRepository.save(tx2);
                                                }
                                            } catch (Exception e) { log.warn("Failed to mark transaction success for id {}: {}", linkedTxId, e.getMessage()); }
                                        }
                                    } else {
                                        log.warn("Payout final check for custRef {} returned status={} amount={}; marking Fail", finalCust, chStatus, chAmount);
                                        gp2.setStatus("Fail");
                                        gatewayPaymentRepository.save(gp2);
                                        if (linkedTxId != null) {
                                            try {
                                                var txOpt2 = transactionRepository.findById(linkedTxId);
                                                if (txOpt2.isPresent()) {
                                                    var tx2 = txOpt2.get();
                                                    tx2.setStatus("Rejected");
                                                    transactionRepository.save(tx2);
                                                }
                                            } catch (Exception e) { log.warn("Failed to mark transaction fail for id {}: {}", linkedTxId, e.getMessage()); }
                                        }
                                    }

                                } catch (Exception ex) {
                                    log.warn("Background payout finalization failed for {}: {}", finalCust, ex.getMessage());
                                }
                            }).start();
                        } catch (Exception ex) {
                            log.warn("Failed to start background payout finalizer for {}: {}", custRef, ex.getMessage());
                        }

                        // leave transaction as Processing (caller may update later)
                        return;
                    } else {
                        Object respMessageObj = resp.get("message");
                        String respMessage = respMessageObj == null ? "" : String.valueOf(respMessageObj);
                        log.warn("Payout API returned unexpected response for custRef {}: success={} status={} amount={} custRef={} message={} resp={}", custRef, succ, respStatus, respAmount, respCust, respMessage, resp);
                        gp.setStatus("Fail");
                        try { gp.setTransactionId(tx.getId()); } catch (Exception e) { /* ignore */ }
                        gatewayPaymentRepository.save(gp);
                        tx.setStatus("Rejected"); transactionRepository.save(tx);
                        try { refundIfWithdrawal(tx); } catch (Exception e) { log.warn("Refund after unexpected payout response failed for tx {}: {}", tx.getId(), e.getMessage()); }
                        return;
                    }
                } catch (RestClientResponseException rcre) {
                    // capture HTTP error response body for debugging
                    String body = "";
                    try { body = rcre.getResponseBodyAsString(); } catch (Exception ignored) {}
                    int statusCode = -1;
                    try { statusCode = rcre.getStatusCode().value(); } catch (Exception ignored) {}
                    log.error("Payout API HTTP error for custRef {}: status={}, responseBody={}", custRef, statusCode, body, rcre);
                    gp.setStatus("Fail");
                    try { gp.setTransactionId(tx.getId()); } catch (Exception e) { /* ignore */ }
                    gatewayPaymentRepository.save(gp);
                    tx.setStatus("Rejected"); transactionRepository.save(tx);
                    try { refundIfWithdrawal(tx); } catch (Exception e) { log.warn("Refund after payout http error failed for tx {}: {}", tx.getId(), e.getMessage()); }
                    return;
                }

            } catch (Exception ex) {
                log.error("Payout API call failed for custRef {}", custRef, ex);
                gp.setStatus("Fail");
                try { gp.setTransactionId(tx.getId()); } catch (Exception e) { /* ignore */ }
                gatewayPaymentRepository.save(gp);
                tx.setStatus("Fail"); transactionRepository.save(tx);
                return;
            }

        } catch (Exception ex) {
            log.error("createPayOut failed", ex);
            try {tx.setStatus("Rejected"); transactionRepository.save(tx); } catch (Exception e) {}
        }
    }

    // Refund user when a withdrawal transaction is rejected
    private void refundIfWithdrawal(TransactionEntity tx) {
        if (tx == null) return;
        try {
            if (tx.getAmount() != null && tx.getAmount() < 0) {
                // idempotency: skip if remark already indicates refund was done
                String rem = tx.getRemarks() == null ? "" : tx.getRemarks();
                if (rem.contains("[refunded]")) {
                    log.info("Skipping refund for tx {} because remarks indicate already refunded", tx.getId());
                    return;
                }

                var userOpt = userRepository.findByMobileNumber(tx.getMobileNumber());
                if (userOpt.isPresent()) {
                    var user = userOpt.get();
                    Integer cur = user.getBalance() == null ? 0 : user.getBalance();
                    int refund = -tx.getAmount();
                    user.setBalance(cur + refund);
                    balanceService.saveAndNotify(user, "Deposit rejected refund");
                    log.info("Refunded user {} amount={} for rejected tx {}", user.getMobileNumber(), refund, tx.getId());

                    // mark transaction remarks to indicate refund was applied
                    try {
                        String newRem = (rem.isBlank() ? "" : rem + " ") + "[refunded]";
                        tx.setRemarks(newRem.trim());
                        transactionRepository.save(tx);
                    } catch (Exception ex) {
                        log.warn("Failed to persist refund remark for tx {}: {}", tx.getId(), ex.getMessage());
                    }
                } else {
                    log.warn("Refund requested but user not found for mobile {} for tx {}", tx.getMobileNumber(), tx.getId());
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to refund user for tx {}: {}", tx.getId(), ex.getMessage());
        }
    }

    // Convenience: reload transaction by id and call createPayOut. Useful for async callers
    public void createPayOutById(Long txId) {
        if (txId == null) return;
        try {
            var txOpt = transactionRepository.findById(txId);
            if (txOpt.isPresent()) {
                createPayOut(txOpt.get());
            } else {
                log.warn("createPayOutById: transaction not found id={}", txId);
            }
        } catch (Exception ex) {
            log.error("createPayOutById failed for id={}", txId, ex);
        }
    }
}
