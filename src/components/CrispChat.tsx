"use client";

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    Crisp.configure("30424f0d-a259-45c1-9a90-bb68dda3ad34");
  });

  return null;
};

export default CrispChat;
