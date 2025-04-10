import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib'; 
import { aws_iam as iam, aws_events_targets as targets, aws_events as events, aws_lambda as lambda} from 'aws-cdk-lib'; 
import * as path from "path";

type RemindingLambdaProps = {
  toAddress: string;
  fromAddress: string;
  rate?: Duration;
};
export class RemindingLambda extends Construct {
  constructor(
    scope: Construct,
    id: string,
    { rate = Duration.hours(3), ...props }: RemindingLambdaProps
  ) {
    super(scope, id);

    // Create the lambda
    const fn = new lambda.Function(this, "EmailReminderLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "emailReminder")),
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
    const rule = new events.Rule(this, "ScheduleRule", {
      schedule: events.Schedule.rate(rate),
    });
    rule.addTarget(new targets.LambdaFunction(fn));
  }
}
