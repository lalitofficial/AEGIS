export const dashboardMetrics = {
  fraudDetectionRate: 98.7,
  suspiciousTransactions: 1247,
  confirmedFrauds: 148,
  falsePositiveRate: 2.3,
};

export const recentFraudAlerts = [
  { 
    id: 1, 
    transactionId: 'TXN-2024-001234',
    type: 'Card Testing', 
    amount: 1250.00,
    customer: 'Aryan Patel',
    customerId: 'CUST-12345',
    riskScore: 95,
    indicators: ['New device', 'VPN usage', 'High-value first purchase'],
    status: 'Blocked', 
    time: '2 min ago' 
  },
  { 
    id: 2, 
    transactionId: 'TXN-2024-001235',
    type: 'Account Takeover', 
    amount: 3500.00,
    customer: 'Aditya Rathi',
    customerId: 'CUST-67890',
    riskScore: 88,
    indicators: ['Login from new country', 'Changed email recently'],
    status: 'Under Investigation', 
    time: '5 min ago' 
  },
  { 
    id: 3, 
    transactionId: 'TXN-2024-001236',
    type: 'Friendly Fraud', 
    amount: 899.99,
    customer: 'Ted Mosby',
    customerId: 'CUST-45678',
    riskScore: 72,
    indicators: ['Chargeback history', 'Disputed transaction'],
    status: 'Pending Review', 
    time: '12 min ago' 
  },
  { 
    id: 4, 
    transactionId: 'TXN-2024-001237',
    type: 'Identity Theft', 
    amount: 5200.00,
    customer: 'Sara Khan',
    customerId: 'CUST-23456',
    riskScore: 91,
    indicators: ['Mismatched billing address', 'Multiple failed attempts'],
    status: 'Blocked', 
    time: '18 min ago' 
  },
  { 
    id: 5, 
    transactionId: 'TXN-2024-001238',
    type: 'Payment Fraud', 
    amount: 750.00,
    customer: ' Mohit Yadav',
    customerId: 'CUST-78901',
    riskScore: 65,
    indicators: ['Unusual merchant category', 'Transaction velocity high'],
    status: 'Approved with Warning', 
    time: '25 min ago' 
  },
];

//fraud graph data start
export const fraudGraphData = {
    nodes: [
        // ======================================================================
        // A. DETECTED CLUSTERS (Confirmed Botnets - NEON RED) - 3 Clusters
        // ======================================================================
        
        // 1. MEGA CARD TESTING BOTNET (Multi-Layered ATO/CNP Fraud Ring)
        // Nodes: The core botnet (10 users, 2 master cards, 1 master IP)
        // *This cluster is the largest and densest, demonstrating the target attack.*
        { id: 'D1_CARD_MASTER_1', label: 'Comp Card 1', group: 'Detected', size: 40, title: 'Detected: Central Stolen Card 1 (ATO Target)' },
        { id: 'D1_CARD_MASTER_2', label: 'Comp Card 2', group: 'Detected', size: 40, title: 'Detected: Central Stolen Card 2 (CNP Target)' },
        { id: 'D1_IP_MASTER', label: 'Botnet Origin', group: 'Detected', size: 30, title: 'Detected: Primary Botnet C&C IP' },
        { id: 'D1_DEV_MASTER', label: 'Master DevID', group: 'Detected', size: 30, title: 'Detected: Shared Device Fingerprint' },
        
        { id: 'D1_U_A1', label: 'Bot A1', group: 'Detected', size: 15, title: 'Bot/Credential Stuffing Account' },
        { id: 'D1_U_A2', label: 'Bot A2', group: 'Detected', size: 15, title: 'Bot/Credential Stuffing Account' },
        { id: 'D1_U_A3', label: 'Bot A3', group: 'Detected', size: 15, title: 'Bot/Credential Stuffing Account' },
        { id: 'D1_U_A4', label: 'Bot A4', group: 'Detected', size: 15, title: 'Bot/Credential Stuffing Account' },
        { id: 'D1_U_A5', label: 'Bot A5', group: 'Detected', size: 15, title: 'Bot/Credential Stuffing Account' },
        { id: 'D1_IP_P1', label: 'Proxy P1', group: 'Detected', size: 20 },
        { id: 'D1_IP_P2', label: 'Proxy P2', group: 'Detected', size: 20 },
        { id: 'D1_IP_P3', label: 'Proxy P3', group: 'Detected', size: 20 },
        { id: 'D1_IP_P4', label: 'Proxy P4', group: 'Detected', size: 20 },

        // 2. SIM SWAP RING (Focus on Account Changes)
        // ----------------------------------------------------------------------
        { id: 'D2_SIM_VICTIM', label: 'SIM Swapped Acct', group: 'Detected', size: 35, title: 'Detected: Victim Account (SIM Swap)' },
        { id: 'D2_NEW_PHONE', label: 'New Phone Num', group: 'Detected', size: 20, title: 'Detected: New Phone Number Change' },
        { id: 'D2_ATM_IP', label: 'Remote ATM IP', group: 'Detected', size: 20, title: 'Detected: Out-of-Country ATM Withdrawal' },

        // 3. REFUND FRAUD BOTNET (Bonus Abuse)
        // ----------------------------------------------------------------------
        { id: 'D3_MERCHANT_REFUND', label: 'High Refund Merchant', group: 'Detected', size: 30, title: 'Detected: High Refund Volume Merchant' },
        { id: 'D3_U_R1', label: 'Refund Acct 1', group: 'Detected', size: 15 },
        { id: 'D3_U_R2', label: 'Refund Acct 2', group: 'Detected', size: 15 },
        
        
        // ======================================================================
        // B. INVESTIGATION CLUSTERS (High-Risk Anomaly - NEON ORANGE) - 5 Clusters
        // ======================================================================

        // 4. SYNTHETIC IDENTITY FRAUD (Shared Info/Multiple Attempts)
        { id: 'I1_ADDRESS', label: 'Shared Address', group: 'Investigation', size: 20, title: 'Investigation: Synthetic ID (Shared Address)' },
        { id: 'I1_U_A', label: 'User Alpha', group: 'Investigation', size: 15 },
        { id: 'I1_U_B', label: 'User Beta', group: 'Investigation', size: 15 },
        { id: 'I1_PHONE', label: 'Shared Phone', group: 'Investigation', size: 15 },

        // 5. SUSPICIOUS MERCHANT VELOCITY (Single user, High Frequency)
        { id: 'I2_U_VELOCITY', label: 'User Velocity', group: 'Investigation', size: 20, title: 'Investigation: Txn Velocity Spike' },
        { id: 'I2_M_1', label: 'Merchant H', group: 'Investigation', size: 15 },
        { id: 'I2_M_2', label: 'Merchant J', group: 'Investigation', size: 15 },
        { id: 'I2_M_3', label: 'Merchant K', group: 'Investigation', size: 15 },

        // 6. INTERNAL RISK (Employee Access)
        { id: 'I3_EMP_ID', label: 'Employee ID 45', group: 'Investigation', size: 25, title: 'Investigation: Internal Access Anomaly' },
        { id: 'I3_INTERNAL_DB', label: 'DB Server', group: 'Investigation', size: 20 },
        { id: 'I3_TIME_ANOMALY', label: 'Time Anomaly', group: 'Investigation', size: 15 },

        // 7. HIGH-VALUE WIRE FRAUD PROFILE (First-time high transfer)
        { id: 'I4_NEW_ACCT', label: 'New Acct Recipient', group: 'Investigation', size: 20, title: 'Investigation: New High-Value Beneficiary' },
        { id: 'I4_TXN_WIRE', label: '₹20 Lakh Wire', group: 'Investigation', size: 15 },

        // 8. PHISHING RECONNAISSANCE (Failed login cluster)
        { id: 'I5_ATTACK_IP', label: 'Attack IP (Phish)', group: 'Investigation', size: 20 },
        { id: 'I5_ACCT_FAIL1', label: 'Fail Acct 1', group: 'Investigation', size: 12 },
        { id: 'I5_ACCT_FAIL2', label: 'Fail Acct 2', group: 'Investigation', size: 12 },


        // ======================================================================
        // C. SUSPICIOUS CLUSTERS (Monitoring Required - NEON CYAN) - 5 Clusters
        // ======================================================================

        // 9. LOW-VALUE CARD TESTING (Small scale, lower risk)
        { id: 'S1_CARD', label: 'Card C', group: 'Suspicious', size: 20 },
        { id: 'S1_U1', label: 'Test 1', group: 'Suspicious', size: 12 },
        { id: 'S1_U2', label: 'Test 2', group: 'Suspicious', size: 12 },

        // 10. HIGH-VALUE FIRST PURCHASE (New user, large amount)
        { id: 'S2_U_NEW', label: 'New User 78', group: 'Suspicious', size: 18 },
        { id: 'S2_TXN_HIGH', label: '₹80K Purchase', group: 'Suspicious', size: 15 },

        // 11. VPN USAGE CLUSTER (Geo-masking)
        { id: 'S3_U_VPN', label: 'VPN User', group: 'Suspicious', size: 15 },
        { id: 'S3_IP_VPN', label: 'VPN IP', group: 'Suspicious', size: 15 },
        
        // 12. FRIENDLY FRAUD PROFILE (Chargeback history)
        { id: 'S4_USER_CB', label: 'Chargeback Profile', group: 'Suspicious', size: 20 },
        { id: 'S4_MERCHANT', label: 'Merchant L', group: 'Suspicious', size: 12 },

        // 13. MULTIPLE FAILED LOGINS (Brute Force/Credential Stuffing)
        { id: 'S5_ACCT_ATTEMPTS', label: 'Acct Attempts', group: 'Suspicious', size: 18 },
        { id: 'S5_IP_FAIL', label: 'IP Fail', group: 'Suspicious', size: 12 },


        // ======================================================================
        // D. SAFE CLUSTERS (Normal Baseline - NEON GREEN) - 20 Clusters
        // ======================================================================

        // SAFE CLUSTERS (Representing normal business flow - 20 Pairs = 40 Nodes)
        { id: 'SAFE_C1_U', label: 'U1', group: 'Safe', size: 10 }, { id: 'SAFE_C1_C', label: 'C1', group: 'Safe', size: 10 },
        { id: 'SAFE_C2_U', label: 'U2', group: 'Safe', size: 10 }, { id: 'SAFE_C2_C', label: 'C2', group: 'Safe', size: 10 },
        { id: 'SAFE_C3_U', label: 'U3', group: 'Safe', size: 10 }, { id: 'SAFE_C3_C', label: 'C3', group: 'Safe', size: 10 },
        { id: 'SAFE_C4_U', label: 'U4', group: 'Safe', size: 10 }, { id: 'SAFE_C4_C', label: 'C4', group: 'Safe', size: 10 },
        { id: 'SAFE_C5_U', label: 'U5', group: 'Safe', size: 10 }, { id: 'SAFE_C5_C', label: 'C5', group: 'Safe', size: 10 },
        { id: 'SAFE_C6_U', label: 'U6', group: 'Safe', size: 10 }, { id: 'SAFE_C6_C', label: 'C6', group: 'Safe', size: 10 },
        { id: 'SAFE_C7_U', label: 'U7', group: 'Safe', size: 10 }, { id: 'SAFE_C7_C', label: 'C7', group: 'Safe', size: 10 },
        { id: 'SAFE_C8_U', label: 'U8', group: 'Safe', size: 10 }, { id: 'SAFE_C8_C', label: 'C8', group: 'Safe', size: 10 },
        { id: 'SAFE_C9_U', label: 'U9', group: 'Safe', size: 10 }, { id: 'SAFE_C9_C', label: 'C9', group: 'Safe', size: 10 },
        { id: 'SAFE_C10_U', label: 'U10', group: 'Safe', size: 10 }, { id: 'SAFE_C10_C', label: 'C10', group: 'Safe', size: 10 },
        { id: 'SAFE_C11_U', label: 'U11', group: 'Safe', size: 10 }, { id: 'SAFE_C11_C', label: 'C11', group: 'Safe', size: 10 },
        { id: 'SAFE_C12_U', label: 'U12', group: 'Safe', size: 10 }, { id: 'SAFE_C12_C', label: 'C12', group: 'Safe', size: 10 },
        { id: 'SAFE_C13_U', label: 'U13', group: 'Safe', size: 10 }, { id: 'SAFE_C13_C', label: 'C13', group: 'Safe', size: 10 },
        { id: 'SAFE_C14_U', label: 'U14', group: 'Safe', size: 10 }, { id: 'SAFE_C14_C', label: 'C14', group: 'Safe', size: 10 },
        { id: 'SAFE_C15_U', label: 'U15', group: 'Safe', size: 10 }, { id: 'SAFE_C15_C', label: 'C15', group: 'Safe', size: 10 },
        { id: 'SAFE_C16_U', label: 'U16', group: 'Safe', size: 10 }, { id: 'SAFE_C16_C', label: 'C16', group: 'Safe', size: 10 },
        { id: 'SAFE_C17_U', label: 'U17', group: 'Safe', size: 10 }, { id: 'SAFE_C17_C', label: 'C17', group: 'Safe', size: 10 },
        { id: 'SAFE_C18_U', label: 'U18', group: 'Safe', size: 10 }, { id: 'SAFE_C18_C', label: 'C18', group: 'Safe', size: 10 },
        { id: 'SAFE_C19_U', label: 'U19', group: 'Safe', size: 10 }, { id: 'SAFE_C19_C', label: 'C19', group: 'Safe', size: 10 },
        { id: 'SAFE_C20_U', label: 'U20', group: 'Safe', size: 10 }, { id: 'SAFE_C20_C', label: 'C20', group: 'Safe', size: 10 },
    ],

    edges: [
        // D1: MEGA CARD TESTING BOTNET
        { from: 'D1_IP_MASTER', to: 'D1_U_A1' }, { from: 'D1_IP_MASTER', to: 'D1_U_A2' }, { from: 'D1_IP_MASTER', to: 'D1_U_A3' },
        { from: 'D1_DEV_MASTER', to: 'D1_U_A4' }, { from: 'D1_DEV_MASTER', to: 'D1_U_A5' }, // Shared Device ID
        { from: 'D1_U_A1', to: 'D1_CARD_MASTER_1' }, { from: 'D1_U_A2', to: 'D1_CARD_MASTER_1' }, { from: 'D1_U_A3', to: 'D1_CARD_MASTER_1' },
        { from: 'D1_U_A4', to: 'D1_CARD_MASTER_2' }, { from: 'D1_U_A5', to: 'D1_CARD_MASTER_2' },
        { from: 'D1_U_A1', to: 'D1_IP_P1' }, { from: 'D1_U_A2', to: 'D1_IP_P2' }, { from: 'D1_U_A3', to: 'D1_IP_P3' }, { from: 'D1_U_A4', to: 'D1_IP_P4' }, 
        
        // D2: SIM SWAP RING
        { from: 'D2_SIM_VICTIM', to: 'D2_NEW_PHONE' }, { from: 'D2_NEW_PHONE', to: 'D2_ATM_IP' },

        // D3: REFUND FRAUD BOTNET
        { from: 'D3_U_R1', to: 'D3_MERCHANT_REFUND' }, { from: 'D3_U_R2', to: 'D3_MERCHANT_REFUND' },
        
        // I1: SYNTHETIC IDENTITY FRAUD
        { from: 'I1_ADDRESS', to: 'I1_U_A' }, { from: 'I1_ADDRESS', to: 'I1_U_B' }, { from: 'I1_U_A', to: 'I1_PHONE' },
        
        // I2: SUSPICIOUS MERCHANT VELOCITY
        { from: 'I2_U_VELOCITY', to: 'I2_M_1' }, { from: 'I2_U_VELOCITY', to: 'I2_M_2' }, { from: 'I2_U_VELOCITY', to: 'I2_M_3' },
        
        // I3: INTERNAL RISK
        { from: 'I3_EMP_ID', to: 'I3_INTERNAL_DB' }, { from: 'I3_EMP_ID', to: 'I3_TIME_ANOMALY' },

        // I4: HIGH-VALUE WIRE FRAUD PROFILE
        { from: 'I4_TXN_WIRE', to: 'I4_NEW_ACCT' }, 

        // I5: PHISHING RECONNAISSANCE
        { from: 'I5_ATTACK_IP', to: 'I5_ACCT_FAIL1' }, { from: 'I5_ATTACK_IP', to: 'I5_ACCT_FAIL2' },
        
        // S1: LOW-VALUE CARD TESTING
        { from: 'S1_U1', to: 'S1_CARD' }, { from: 'S1_U2', to: 'S1_CARD' },

        // S2: HIGH-VALUE FIRST PURCHASE
        { from: 'S2_U_NEW', to: 'S2_TXN_HIGH' },

        // S3: VPN USAGE CLUSTER
        { from: 'S3_U_VPN', to: 'S3_IP_VPN' },
        
        // S4: FRIENDLY FRAUD PROFILE
        { from: 'S4_USER_CB', to: 'S4_MERCHANT' },

        // S5: MULTIPLE FAILED LOGINS
        { from: 'S5_ACCT_ATTEMPTS', to: 'S5_IP_FAIL' },
        
        // SAFE CLUSTERS (Normal Transactions - 20 pairs)
        { from: 'SAFE_C1_U', to: 'SAFE_C1_C' }, { from: 'SAFE_C2_U', to: 'SAFE_C2_C' }, { from: 'SAFE_C3_U', to: 'SAFE_C3_C' },
        { from: 'SAFE_C4_U', to: 'SAFE_C4_C' }, { from: 'SAFE_C5_U', to: 'SAFE_C5_C' }, { from: 'SAFE_C6_U', to: 'SAFE_C6_C' },
        { from: 'SAFE_C7_U', to: 'SAFE_C7_C' }, { from: 'SAFE_C8_U', to: 'SAFE_C8_C' }, { from: 'SAFE_C9_U', to: 'SAFE_C9_C' },
        { from: 'SAFE_C10_U', to: 'SAFE_C10_C' }, { from: 'SAFE_C11_U', to: 'SAFE_C11_C' }, { from: 'SAFE_C12_U', to: 'SAFE_C12_C' },
        { from: 'SAFE_C13_U', to: 'SAFE_C13_C' }, { from: 'SAFE_C14_U', to: 'SAFE_C14_C' }, { from: 'SAFE_C15_U', to: 'SAFE_C15_C' },
        { from: 'SAFE_C16_U', to: 'SAFE_C16_C' }, { from: 'SAFE_C17_U', to: 'SAFE_C17_C' }, { from: 'SAFE_C18_U', to: 'SAFE_C18_C' },
        { from: 'SAFE_C19_U', to: 'SAFE_C19_C' }, { from: 'SAFE_C20_U', to: 'SAFE_C20_C' },
    ],
};
//fraud graph data end

export const fraudTrendData = [
  { time: '00:00', total: 45, blocked: 42, cardFraud: 15, accountTakeover: 12, identityTheft: 8, paymentFraud: 7 },
  { time: '04:00', total: 28, blocked: 26, cardFraud: 10, accountTakeover: 8, identityTheft: 5, paymentFraud: 3 },
  { time: '08:00', total: 62, blocked: 58, cardFraud: 22, accountTakeover: 18, identityTheft: 10, paymentFraud: 8 },
  { time: '12:00', total: 89, blocked: 84, cardFraud: 32, accountTakeover: 25, identityTheft: 15, paymentFraud: 12 },
  { time: '16:00', total: 105, blocked: 98, cardFraud: 38, accountTakeover: 30, identityTheft: 18, paymentFraud: 14 },
  { time: '20:00', total: 71, blocked: 67, cardFraud: 25, accountTakeover: 20, identityTheft: 12, paymentFraud: 10 },
  { time: 'Now', total: 52, blocked: 49, cardFraud: 18, accountTakeover: 15, identityTheft: 9, paymentFraud: 7 }
];

export const fraudTypeDistribution = [
  { type: 'Card Not Present', count: 42, percentage: 42, color: '#ef4444' },
  { type: 'Account Takeover', count: 28, percentage: 28, color: '#f97316' },
  { type: 'Friendly Fraud', count: 15, percentage: 15, color: '#eab308' },
  { type: 'Identity Theft', count: 10, percentage: 10, color: '#8b5cf6' },
  { type: 'Payment Fraud', count: 5, percentage: 5, color: '#06b6d4' },
];

export const riskFactorsData = [
  { category: 'High-Risk Customers', count: 8, color: '#ef4444' },
  { category: 'High-Risk Merchants', count: 23, color: '#f97316' },
  { category: 'Compromised Accounts', count: 45, color: '#eab308' },
  { category: 'Data Quality Issues', count: 72, color: '#22c55e' },
];

export const customerRiskDetails = [
  { 
    id: 1, 
    customerId: 'CUST-12345',
    name: 'Hridik Gaikwad', 
    riskScore: 92,
    riskFactors: ['Multiple failed logins', 'Changed email recently', 'Unusual transaction pattern'],
    status: 'Under Review',
    lastActivity: '2024-12-01',
    accountAge: '2 years'
  },
  { 
    id: 2, 
    customerId: 'CUST-67890',
    name: 'Diksha Patil', 
    riskScore: 85,
    riskFactors: ['New device detected', 'Location mismatch', 'High-value purchases'],
    status: 'Monitoring',
    lastActivity: '2024-11-28',
    accountAge: '1 year'
  },
  { 
    id: 3, 
    customerId: 'CUST-45678',
    name: 'Riyan Jain', 
    riskScore: 78,
    riskFactors: ['Payment method changes', 'VPN usage', 'Multiple addresses'],
    status: 'Monitoring',
    lastActivity: '2024-11-25',
    accountAge: '3 years'
  },
  { 
    id: 4, 
    customerId: 'CUST-23456',
    name: 'Om Sharma', 
    riskScore: 95,
    riskFactors: ['Account takeover attempt', 'Credential breach', 'Unauthorized access'],
    status: 'Restricted',
    lastActivity: '2024-11-20',
    accountAge: '6 months'
  },
  { 
    id: 5, 
    customerId: 'CUST-78901',
    name: 'Ananya Singh', 
    riskScore: 71,
    riskFactors: ['Transaction velocity high', 'New payment methods', 'Device fingerprint mismatch'],
    status: 'Monitoring',
    lastActivity: '2024-12-03',
    accountAge: '4 years'
  },
];

export const complianceFrameworks = [
  { name: 'PCI DSS', score: 92, status: 'Compliant', lastAudit: '2024-11-15', description: 'Payment Card Industry Data Security Standard' },
  { name: 'AML Compliance', score: 88, status: 'Compliant', lastAudit: '2024-10-20', description: 'Anti-Money Laundering' },
  { name: 'KYC Requirements', score: 95, status: 'Compliant', lastAudit: '2024-11-01', description: 'Know Your Customer' },
  { name: 'GDPR', score: 90, status: 'Compliant', lastAudit: '2024-10-28', description: 'General Data Protection Regulation' },
  { name: 'SOX', score: 85, status: 'Needs Review', lastAudit: '2024-09-10', description: 'Sarbanes-Oxley Act' },
];

export const monitoredAccounts = [
  { 
    name: 'Personal Checking', 
    count: 12450, 
    clean: 12380, 
    flagged: 70,
    status: 'healthy',
    lastScan: '2 hours ago',
    transactionVolume: '2.3M'
  },
  { 
    name: 'Business Accounts', 
    count: 3200, 
    clean: 3150, 
    flagged: 50,
    status: 'warning',
    lastScan: '1 hour ago',
    transactionVolume: '8.7M'
  },
  { 
    name: 'Credit Card Accounts', 
    count: 8500, 
    clean: 8420, 
    flagged: 80,
    status: 'warning',
    lastScan: '30 min ago',
    transactionVolume: '5.1M'
  },
  { 
    name: 'Merchant Accounts', 
    count: 1200, 
    clean: 1180, 
    flagged: 20,
    status: 'healthy',
    lastScan: '1 hour ago',
    transactionVolume: '12.4M'
  },
  { 
    name: 'High-Value Accounts', 
    count: 137, 
    clean: 126, 
    flagged: 11,
    status: 'critical',
    lastScan: '15 min ago',
    transactionVolume: '45.8M'
  },
];

export const fraudDetectionPosture = [
  { category: 'Card Fraud Detection', score: 94 },
  { category: 'Account Takeover', score: 88 },
  { category: 'Money Laundering', score: 91 },
  { category: 'Payment Fraud', score: 85 },
  { category: 'Identity Theft', score: 92 },
  { category: 'Wire Fraud', score: 87 }
];

export const liveSignals = [
  {
    id: 1,
    title: 'Velocity spike in prepaid cards',
    detail: '12x baseline across 3 BINs',
    severity: 'critical',
    time: '2m ago'
  },
  {
    id: 2,
    title: 'Account takeover cluster',
    detail: 'Credential stuffing from 4 geos',
    severity: 'high',
    time: '6m ago'
  },
  {
    id: 3,
    title: 'Friendly fraud pattern',
    detail: 'Chargeback surge in travel',
    severity: 'medium',
    time: '12m ago'
  },
  {
    id: 4,
    title: 'Device fingerprint collision',
    detail: 'Shared device across 9 accounts',
    severity: 'low',
    time: '21m ago'
  }
];

export const modelHealth = [
  { name: 'Fraud Detector', score: 98, drift: 'Low', latency: '84ms' },
  { name: 'Risk Scorer', score: 95, drift: 'Low', latency: '58ms' },
  { name: 'Graph Analyzer', score: 92, drift: 'Moderate', latency: '132ms' }
];

export const responsePlaybooks = [
  {
    title: 'Auto-block + notify',
    description: 'Block card, push verification, open case.',
    coverage: 'High',
    eta: '45s'
  },
  {
    title: 'Step-up challenge',
    description: 'OTP + biometric for high-value transfers.',
    coverage: 'Medium',
    eta: '2m'
  },
  {
    title: 'Merchant hold',
    description: 'Pause settlement for risky merchant.',
    coverage: 'Selective',
    eta: '10m'
  }
];

export const triageQueue = [
  {
    id: 1,
    title: 'Card testing burst',
    owner: 'A. Singh',
    amount: '₹1.2M',
    status: 'Investigate',
    eta: '15m'
  },
  {
    id: 2,
    title: 'Account takeover suspected',
    owner: 'K. Mehta',
    amount: '₹420K',
    status: 'Blocked',
    eta: '5m'
  },
  {
    id: 3,
    title: 'High-value wire anomaly',
    owner: 'R. Shah',
    amount: '₹3.8M',
    status: 'Review',
    eta: '30m'
  }
];
