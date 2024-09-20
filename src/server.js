import { web } from "./application/web.js";
import { logger } from "./application/logging.js";


const port = parseInt(process.env.APP_PORT) || process.argv[ 3 ] || 3000;
web.listen(port, '0.0.0.0', () => {
  logger.info(`Application running on port ${ port }`)
})