import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { UnibetClient } from "./client/unibet-client";
import { VeikkausClient } from "./client/veikkaus-client";
import { Card, Race } from "./model/types";

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {    
    switch (event.path) {

      case '/cards':
        return {
          statusCode: 200,
          body: `Finding tracks`
        }
      case '/odds':
        return {
          statusCode: 200,
          body: `Finding odds`
        }
      default:
        return {
          statusCode: 404,
          body: `Not found`
        }
    }
}