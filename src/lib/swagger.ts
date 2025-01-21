import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "SchedOwl Documentation",
        version: "v1.0",
      },
    },
  });
  return spec;
};
