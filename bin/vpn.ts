#!/usr/bin/env node
import "source-map-support/register";
import { App } from 'aws-cdk-lib'; 
import { VpnStack } from "../src/vpn/stack";
import { VpcStack } from "../src/vpc-stack";
import { vars } from "./vpn.vars";

const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION,
};

const app = new App();
const vpcStack = new VpcStack(app, "VpcStack", { env });
new VpnStack(app, "VpnStack", {
  env,
  vpc: vpcStack.vpc,
  ...vars,
});
