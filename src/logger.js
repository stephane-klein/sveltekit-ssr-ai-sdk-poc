import pino from "pino";
import pinoPretty from "pino-pretty";

const prettyTransport = new pinoPretty({
    colorize: true,
    translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
    singleLine: false,
    ignore: "pid,hostname",
    sync: true,
});

export const logger = pino(
    {
        level: "debug",
    },
    process.env.NODE_ENV !== "production" ? prettyTransport : pino.destination(1),
);