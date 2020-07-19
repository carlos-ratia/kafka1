import dotEnv from "dotenv";
import _ from "lodash";
import { Kafka, logLevel } from "kafkajs";
import { EachMessagePayload } from "kafkajs";
import ip from "ip";

dotEnv.config();

_.forIn(
  {
    KAFKA_LOGLEVEL: process.env.KAFKA_LOGLEVEL,
    KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,
    CONSUMER_SUBSCRIBE_TOPIC: process.env.CONSUMER_SUBSCRIBE_TOPIC,
    CONSUMER_CONFIG_GROUP_ID: process.env.CONSUMER_CONFIG_GROUP_ID,
  },
  (value, key) => {
    if (value === undefined || value === null || _.isEmpty(value)) {
      console.error(`The ${key} is no define in the .env`);
      process.exit(1);
    }
  }
);

const errorTypes: string[] = ["unhandledRejection", "uncaughtException"];
const signalTraps: NodeJS.Signals[] = ["SIGTERM", "SIGINT", "SIGUSR2"];
const host: string = process.env.HOST_IP || ip.address();
const broker: string =
  process.env.KAFKA_BROKER === undefined
    ? `${host}:9092`
    : process.env.KAFKA_BROKER;

const kafka = new Kafka({
  logLevel: (process.env.KAFKA_LOGLEVEL as unknown) as logLevel,
  brokers: [broker],
  clientId: process.env.KAFKA_CLIENT_ID,
});

const topic: string = process.env.CONSUMER_SUBSCRIBE_TOPIC as string;
const consumer = kafka.consumer({ groupId: "test-group" });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: topic, fromBeginning: true });
  await consumer.run({
    // eachBatch: async ({ batch }) => {
    //   console.log(batch)
    // },
    eachMessage: async (payload: EachMessagePayload) => {
      const prefix = `${topic}[${payload.partition} | ${payload.message.offset}] / ${payload.message.timestamp}`;
      console.log(
        `- ${prefix} ${payload.message.key}#${payload.message.value}`
      );
    },
  });
};

run().catch((e) => console.error(`[ERROR] ${e.message}`, e));

errorTypes.map((type: string) => {
  process.on(type, async (e) => {
    try {
      console.log(`process.on ${type}`);
      console.error(e);
      await consumer.disconnect();
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.map((type: NodeJS.Signals) => {
  process.once(type, async () => {
    try {
      await consumer.disconnect();
    } finally {
      process.kill(process.pid, type);
    }
  });
});
