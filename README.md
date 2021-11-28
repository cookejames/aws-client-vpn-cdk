# AWS VPN

## Introduction

AWS CDK code to create a client VPN.

## Setup

1. [Create certs](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/client-authentication.html#mutual)
2. Create SSM parameter `vpn-server-certificate` with ARN of certificate
3. Enable SES
4. Copy bin/vpn.vars.example.ts to bin/vpn.vars.ts
5. On first run download the openvpn client settings from the AWS console (VPC/client vpn endpoint)
   You must replace the remote option with the domain name you use and add <cert> and <key> sections with the client cert you created.

## Use

On the first run only you must create a VPC - this has no cost so can be left running.

`./cdk-on.sh <ACCOUNT_NUMBER> <REGION> deploy VpcStack`

Now deploy the VPN - this has an hourly cost

`./cdk-on.sh <ACCOUNT_NUMBER> <REGION> deploy VpnStack`

When you are done destroy the stack with 

`./cdk-on.sh <ACCOUNT_NUMBER> <REGION> destory VpnStack`