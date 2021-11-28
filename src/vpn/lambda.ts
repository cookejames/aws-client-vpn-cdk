import * as cdk from "@aws-cdk/core";
import { Function, Runtime, Code } from "@aws-cdk/aws-lambda";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as path from "path";

type RemindingLambdaProps = {
  toAddress: string;
  fromAddress: string;
  rate?: cdk.Duration;
};
export class RemindingLambda extends cdk.Construct {
  constructor(
    scope: cdk.Construct,
    id: string,
    { rate = cdk.Duration.hours(3), ...props }: RemindingLambdaProps
  ) {
    super(scope, id);

    // Create the lambda
    const fn = new Function(this, "EmailReminderLambda", {
      runtime: Runtime.NODEJS_14_X,
      handler: "index.handler",
      code: Code.fromAsset(path.join(__dirname, "emailReminder")),
      environment: {
        TO_ADDRESS: props.toAddress,
        FROM_EMAIL_ADDRESS: props.fromAddress,
      },
    });

    // Add permissions to send the email
    const emailSendingPolicy = new iam.PolicyStatement({
      actions: ["ses:SendEmail", "ses:SendRawEmail"],
      resources: ["*"],
    });
    fn.role?.attachInlinePolicy(
      new iam.Policy(this, "SendEmailPolicy", {
        statements: [emailSendingPolicy],
      })
    );

    // Schedule the email to be sent
    const rule = new Rule(this, "ScheduleRule", {
      schedule: Schedule.rate(rate),
    });
    rule.addTarget(new targets.LambdaFunction(fn));
  }
}
