"use client";

import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  MONTHLY_SUBSCRIPTION_PLANS,
  YEARLY_SUBSCRIPTION_PLANS,
} from "@/src/constants/products";
import Image from "next/image";
import Button from "@/src/components/Button";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreateSubscriptionSchema } from "@/src/schema";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import { FlagImage } from "react-international-phone";
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { toast } from "react-toastify";

// Register the English locale
countries.registerLocale(enLocale);

type FormValues = z.infer<typeof CreateSubscriptionSchema>;

export default function BillingPage() {
  const [isMonthly, setIsMonthly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<
    | (typeof MONTHLY_SUBSCRIPTION_PLANS)[0]
    | (typeof YEARLY_SUBSCRIPTION_PLANS)[0]
    | null
  >(null);
  const [supportedCountries, setSupportedCountries] = useState<string[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(true);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSupportedCountries = async () => {
      try {
        const response = await axios.get(
          "/api/dodopayments/supported-countries"
        );
        setSupportedCountries(response.data);
      } catch (error) {
        console.error("Error fetching supported countries:", error);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchSupportedCountries();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setIsCountryDropdownOpen(false);
    setValue("billing.country", countryCode);
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(CreateSubscriptionSchema),
    defaultValues: {
      customer: {
        name: "",
        email: "",
      },
      billing: {
        country: "",
        street: "",
        city: "",
        state: "",
        zipcode: "",
      },
      product_id: "",
      quantity: 1,
    },
  });

  const handleChoosePlan = (
    plan:
      | (typeof MONTHLY_SUBSCRIPTION_PLANS)[0]
      | (typeof YEARLY_SUBSCRIPTION_PLANS)[0]
  ) => {
    setSelectedPlan(plan);
    setValue("product_id", plan.id); // Set the product_id in the form
    setShowSubscriptionForm(true);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const submissionData = {
      ...data,
      product_id: selectedPlan?.id,
      quantity: 1,
    };

    try {
      setIsLoading(true);
      const response = await axios.post(
        "/api/dodopayments/subscriptions",
        submissionData
      );

      const responseData = response.data;

      if (responseData.error) {
        throw new Error(responseData.error || "Failed to create subscription");
      }

      router.push(responseData.payment_link);
    } catch {
      toast.error("Failed to create subscription");
    } finally {
      setIsLoading(false);
      setShowSubscriptionForm(false);
    }
  };

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

      <div>
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                isMonthly ? "bg-[#444CE7] text-white" : "text-gray-600"
              }`}
              onClick={() => setIsMonthly(true)}
            >
              Monthly
            </button>
            <button
              className={`relative px-4 py-2 text-sm font-medium rounded-md focus:outline-none ${
                !isMonthly ? "bg-[#444CE7] text-white" : "text-gray-600"
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
              className={`relative w-max flex flex-col border rounded-[16px] p-6 transition-all duration-300 shadow-lg transform hover:-translate-y-1 ${
                plan.popular ? "border-[#444CE7]" : "border-[#EAECF0]"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#444CE7] text-white text-xs px-3 py-1.5 rounded-[16px]">
                  Popular
                </div>
              )}
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
                        <Check size={16} className="text-[#444CE7]" />
                      ) : (
                        <X size={16} className="text-[#98A2B3]" />
                      )}
                      {feature.name}
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                variant="primary"
                size="small"
                onClick={() => handleChoosePlan(plan)}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : `Choose ${plan.title}`}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Form Dialog */}
      {showSubscriptionForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 rounded-full bg-gray-100 hover:bg-gray-200 p-2"
              onClick={() => setShowSubscriptionForm(false)}
            >
              <X size={16} />
            </button>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4 text-sm"
            >
              <h3 className="font-semibold">Enter your information</h3>
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-[#344054] font-medium">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("customer.name")}
                  className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
                />
                {errors.customer?.name && (
                  <p className="text-red-500 text-xs">
                    {errors.customer.name.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-[#344054] font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register("customer.email")}
                  className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
                />
                {errors.customer?.email && (
                  <p className="text-red-500 text-xs">
                    {errors.customer.email.message}
                  </p>
                )}
              </div>

              <h3 className="font-semibold">Billing address</h3>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="billing.country"
                  className="text-[#344054] font-medium"
                >
                  Country <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 text-[#667085] px-2.5 py-2.5 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D] bg-white"
                    onClick={() =>
                      setIsCountryDropdownOpen(!isCountryDropdownOpen)
                    }
                    disabled={isLoadingCountries}
                  >
                    {selectedCountry ? (
                      <>
                        <FlagImage
                          iso2={selectedCountry.toLowerCase()}
                          style={{ width: "1.5em", height: "auto" }}
                        />
                        <span>
                          {countries.getName(selectedCountry, "en") ||
                            selectedCountry}
                        </span>
                      </>
                    ) : (
                      <span>
                        {isLoadingCountries
                          ? "Loading countries..."
                          : "Select a country"}
                      </span>
                    )}
                    {isCountryDropdownOpen ? (
                      <ChevronUp size={16} className="text-gray-400 ml-auto" />
                    ) : (
                      <ChevronDown
                        size={16}
                        className="text-gray-400 ml-auto"
                      />
                    )}
                  </button>

                  {isCountryDropdownOpen && (
                    <div className="absolute z-50 w-full h-40 mt-1 bg-white border border-[#D0D5DD] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {supportedCountries
                        .sort((a, b) => {
                          const nameA = countries.getName(a, "en") || a;
                          const nameB = countries.getName(b, "en") || b;
                          return nameA.localeCompare(nameB);
                        })
                        .map((countryCode) => (
                          <button
                            key={countryCode}
                            type="button"
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                            onClick={() => handleCountrySelect(countryCode)}
                          >
                            <FlagImage
                              iso2={countryCode.toLowerCase()}
                              style={{ width: "1.5em", height: "auto" }}
                            />
                            <span className="text-[#344054]">
                              {countries.getName(countryCode, "en") ||
                                countryCode}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}

                  {/* Register the country field */}
                  <input
                    type="text"
                    {...register("billing.country")}
                    value={selectedCountry}
                    onChange={(e) => handleCountrySelect(e.target.value)}
                    className="hidden"
                  />
                </div>
                {errors.billing?.country && (
                  <p className="text-red-500 text-xs">
                    {errors.billing.country.message?.toString()}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="billing.street"
                  className="text-[#344054] font-medium"
                >
                  Street <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("billing.street")}
                  className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
                />
                {errors.billing?.street && (
                  <p className="text-red-500 text-xs">
                    {errors.billing.street.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="billing.zipcode"
                    className="text-[#344054] font-medium"
                  >
                    Zipcode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("billing.zipcode")}
                    className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
                  />
                  {errors.billing?.zipcode && (
                    <p className="text-red-500 text-xs">
                      {errors.billing.zipcode.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="billing.state"
                    className="text-[#344054] font-medium"
                  >
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("billing.state")}
                    className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
                  />
                  {errors.billing?.state && (
                    <p className="text-red-500 text-xs">
                      {errors.billing.state.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="billing.city"
                    className="text-[#344054] font-medium"
                  >
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("billing.city")}
                    className="text-[#667085] px-2.5 py-2 border border-[#D0D5DD] rounded-lg shadow-[0px_1px_2px_0px_#1018280D]"
                  />
                  {errors.billing?.city && (
                    <p className="text-red-500 text-xs">
                      {errors.billing.city.message}
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" size="small" disabled={isLoading}>
                {isLoading ? "Processing..." : "Confirm Subscription"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
