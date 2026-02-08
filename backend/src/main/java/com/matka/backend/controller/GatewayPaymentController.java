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

    @Value("${payment.gateway.apikey:}")
    private String paymentGatewayApiKey;

    @Value("${payment.gateway.authEmail:sara1234@gmail.com}")
    private String paymentGatewayAuthEmail;

    private static final String PAYMENT_GATEWAY_URL = "https://primexpay.in/api/payments/create";

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
            payload.put("mobileNumber", mobile);
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
        String cust = payload.get("custRefNum") == null ? null : String.valueOf(payload.get("custRefNum"));
        String status = payload.get("status") == null ? null : String.valueOf(payload.get("status"));
        String dateStr = payload.get("date") == null ? null : String.valueOf(payload.get("date"));

        Double amountD = null;
        try { if (payload.get("amount") != null) amountD = Double.parseDouble(String.valueOf(payload.get("amount"))); } catch (Exception ex) { }

        if (cust == null || cust.isBlank()) return ResponseEntity.badRequest().body(Map.of("message","custRefNum required"));

        var gpOpt = gatewayPaymentRepository.findById(cust);
        if (gpOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message","GatewayPayment not found for custRefNum: "+cust));

        GatewayPayment gp = gpOpt.get();

        boolean success = status != null && status.equalsIgnoreCase("success");

        // If this GatewayPayment is already marked Success, avoid re-processing
        if (gp.getStatus() != null && gp.getStatus().equalsIgnoreCase("success")) {
            log.info("Callback received for custRefNum={} but already processed as Success", cust);
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

                    transactionRepository.save(tx);

                    // credit user's balance
                    var userOpt = userRepository.findByMobileNumber(gp.getMobileNumber());
                    if (userOpt.isPresent()) {
                        var user = userOpt.get();
                        Integer cur = user.getBalance() == null ? 0 : user.getBalance();
                        user.setBalance(cur + gp.getAmount());
                        userRepository.save(user);
                    }
                }

                return ResponseEntity.ok(Map.of("message","Callback processed","status",gp.getStatus()));
            } catch (Exception ex) {
                log.error("Failed to process callback success actions", ex);
                return ResponseEntity.status(500).body(Map.of("message","Failed to process callback","error", ex.getMessage()));
            }
        } else {
            gp.setStatus("Fail");
            gatewayPaymentRepository.save(gp);
            return ResponseEntity.ok(Map.of("message","Callback marked as Fail","status",gp.getStatus()));
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
}
