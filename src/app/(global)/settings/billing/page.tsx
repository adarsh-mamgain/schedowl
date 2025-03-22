"use client";

import { Check, X } from "lucide-react";
import {
  MONTHLY_SUBSCRIPTION_PLANS,
  YEARLY_SUBSCRIPTION_PLANS,
} from "@/src/constants/products";
import Image from "next/image";
import Button from "@/src/components/Button";
import { useState } from "react";

export default function BillinPage() {
  const [isMonthly, setIsMonthly] = useState(true);
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[#101828] text-sm font-semibold">
              Account plans
            </h2>
          </div>
          <p className="text-sm text-[#475467]">
            Pick an account plan that fits your workflow.
          </p>
        </div>
      </div>

      <hr color="#E4E7EC" />

      <div className="">
        <div className="flex justify-center p-8 mb-1">
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                isMonthly ? "bg-[#1570EF] text-white" : "text-gray-600"
              }`}
              onClick={() => setIsMonthly(true)}
            >
              Monthly
            </button>
            <button
              className={`relative px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                !isMonthly ? "bg-[#1570EF] text-white" : "text-gray-600"
              }`}
              onClick={() => setIsMonthly(false)}
            >
              <span>Yearly (Save 15%)</span>
              <div className="absolute -top-5 -right-10 bg-green-600 text-white text-xs px-3 py-1.5 rounded-full animate-bounce">
                Save 2 months!
              </div>
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-6">
          {(isMonthly
            ? MONTHLY_SUBSCRIPTION_PLANS
            : YEARLY_SUBSCRIPTION_PLANS
          ).map((plan) => (
            <div
              key={plan.id}
              className={`w-max flex flex-col border rounded-[16px] p-6 transition-all duration-300 shadow-lg transform hover:-translate-y-1 ${
                plan.popular ? "border-[#1570EF]" : "border-[#EAECF0]"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center border border-[#EAECF0] rounded-lg shadow overflow-hidden">
                  <Image
                    src={plan.image.src}
                    alt={plan.title}
                    width={80}
                    height={80}
                    priority
                  />
                </div>
                <div>
                  <h3 className="text-[#101828] text-2xl font-semibold">
                    {plan.title}
                  </h3>
                  <div className="text-[#475467]">
                    <span className="text-[#101828] text-xl font-semibold">
                      ${plan.price}
                    </span>
                    /{isMonthly ? "month" : "year"}
                    {!isMonthly && (
                      <div className="text-green-600 text-sm font-medium">
                        ${((plan.price / 10) * 2).toFixed(2)} saved per year!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-grow mb-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature.name}
                      className={`flex items-center gap-2 text-sm ${
                        feature.available ? "text-[#475467]" : "text-[#98A2B3]"
                      }`}
                    >
                      {feature.available ? (
                        <Check size={16} className="text-[#1570EF]" />
                      ) : (
                        <X size={16} className="text-[#98A2B3]" />
                      )}
                      {feature.name}
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant="primary" size="small">
                Choose {plan.title}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
