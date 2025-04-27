import React, { ReactNode } from "react";
import Link from "next/link";
import { PageContainer } from "./PageContainer";
import { MessageBox } from "./MessageBox";

interface SuccessPageProps {
  title: string;
  children: ReactNode;
  continueText?: string;
  continueLink?: string;
  showContactLink?: boolean;
  contactText?: string;
}

export function SuccessPage({
  title,
  children,
  continueText = "Continue Shopping",
  continueLink = "/products",
  showContactLink = false,
  contactText = "Contact our team",
}: SuccessPageProps) {
  return (
    <PageContainer title={title}>
      <div className="space-y-6">
        <MessageBox type="success" className="mb-4">
          {children}
        </MessageBox>

        <div className="flex flex-col space-y-4">
          <Link
            href={continueLink}
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <span>{continueText}</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>

          {showContactLink && (
            <div className="text-sm text-gray-500 mt-4">
              Have questions about your order?{" "}
              <Link
                href="/contact"
                className="text-blue-600 hover:text-blue-800"
              >
                {contactText}
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
