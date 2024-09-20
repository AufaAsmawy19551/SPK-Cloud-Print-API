import { web } from "./application/web.js";
import { logger } from "./application/logging.js";


const port = 8000
web.listen(port, () => {
  logger.info(`Application running on port ${port}`)
})