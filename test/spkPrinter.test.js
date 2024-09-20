import supertest from "supertest";
import { web } from "../src/application/web.js";
import { logger } from "../src/application/logging.js";

describe('POST /api/spk-printer/find-printer', function () {

  it('should can find printer', async () => {
    const result = await supertest(web)
      .post('/api/spk-printer/find-printer')
      .send({});

    expect(result.status).toBe(200);
  })

})

