# AWS VPN

1. [Create certs](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/client-authentication.html#mutual)
2. Create SSM parameter `vpn-server-certificate` with ARN of certificate
3. Enable SES
4. Copy bin/vpn.vars.example.ts to bin/vpn.vars.ts
