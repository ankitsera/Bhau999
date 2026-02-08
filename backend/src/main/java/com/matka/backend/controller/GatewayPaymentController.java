package com.matka.backend.controller;

import com.matka.backend.GatewayPayment;
import com.matka.backend.repository.GatewayPaymentRepository;
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

    private int readMinBetAmount() {
        try {
            var prop = propertiesRepository.findById("min_bet_amount");
            if (prop.isPresent()) {
                String v = prop.get().getValue();
                if (v != null && !v.isBlank()) return Integer.parseInt(v);
            }
        } catch (Exception ex) {
            log.warn("Failed to read min_bet_amount property", ex);
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

        int min = readMinBetAmount();
        if (amount < min) {
            return ResponseEntity.badRequest().body(Map.of("message","Amount must be >= min_bet_amount","min_bet_amount",min));
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
                return ResponseEntity.ok(Map.of("message",resp.get("message"),  "amount", rAmount, "upiIntentUrl", url));
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
}
