// import winston from "winston";
// import path from "path";

// const logDir = path.join(__dirname, "../logs");

// const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.printf(
//       ({ timestamp, level, message }) =>
//         `${timestamp} [${level.toUpperCase()}]: ${message}`
//     )
//   ),
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({
//       filename: `${logDir}/error.log`,
//       level: "error",
//     }),
//     new winston.transports.File({ filename: `${logDir}/combined.log` }),
//   ],
// });

// export default logger;

// bun add winston @types/winston
