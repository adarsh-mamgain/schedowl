import { getApiDocs } from "@/src/lib/swagger";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default async function IndexPage() {
  const spec = await getApiDocs();
  return <SwaggerUI spec={spec} />;
}
