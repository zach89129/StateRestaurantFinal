// "use client";

// import { useState, useEffect } from "react";
// import { XMarkIcon } from "@heroicons/react/24/outline";

// interface ManufacturerDetails {
//   specifications: string;
//   care: string;
//   warranty: string;
//   certifications: string;
//   materials: string;
//   sources: string[];
// }

// interface ManufacturerDetailsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   sku: string;
//   manufacturer: string;
//   inHouseDetails: string;
// }

// export default function ManufacturerDetailsModal({
//   isOpen,
//   onClose,
//   sku,
//   manufacturer,
//   inHouseDetails,
// }: ManufacturerDetailsModalProps) {
//   const [details, setDetails] = useState<ManufacturerDetails | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [cached, setCached] = useState(false);

//   useEffect(() => {
//     if (isOpen && !details) {
//       fetchDetails();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [isOpen]);

//   const fetchDetails = async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const body = {
//         stateSku: encodeURIComponent(sku),
//         manufacturer: encodeURIComponent(manufacturer),
//         details: inHouseDetails,
//       };
//       const response = await fetch(`/api/manufacturer-details?`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(body),
//       });

//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(data.error || "Failed to fetch manufacturer details");
//       }

//       setDetails(data.details);
//       setCached(data.cached || false);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "An error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleRefresh = () => {
//     setDetails(null);
//     fetchDetails();
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex min-h-screen items-center justify-center p-4">
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
//           onClick={onClose}
//         ></div>

//         <div className="relative z-50 w-full max-w-3xl bg-white rounded-lg shadow-xl">
//           <div className="flex items-center justify-between border-b p-6">
//             <div>
//               <h2 className="text-xl font-semibold text-gray-900">
//                 Manufacturer Details
//               </h2>
//               <p className="text-sm text-gray-600 mt-1">
//                 {manufacturer} - {sku}
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 transition-colors"
//             >
//               <XMarkIcon className="h-6 w-6" />
//             </button>
//           </div>

//           <div className="p-6 max-h-[70vh] overflow-y-auto">
//             {loading && (
//               <div className="flex flex-col items-center justify-center py-12">
//                 <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
//                 <p className="mt-4 text-gray-600">
//                   Gathering manufacturer information...
//                 </p>
//                 <p className="text-sm text-gray-500 mt-2">
//                   This may take a moment
//                 </p>
//               </div>
//             )}

//             {error && (
//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                 <p className="text-yellow-800 font-medium">
//                   Information Not Available
//                 </p>
//                 <p className="text-yellow-700 text-sm mt-1">{error}</p>
//                 <p className="text-yellow-600 text-xs mt-2">
//                   This could mean the manufacturer doesn&apos;t have detailed
//                   product information online, or it&apos;s not easily
//                   accessible. For specific details, please contact your sales
//                   representative.
//                 </p>
//                 <button
//                   onClick={handleRefresh}
//                   className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium"
//                 >
//                   Try Again
//                 </button>
//               </div>
//             )}

//             {details && !loading && (
//               <div className="space-y-2">
//                 {cached && (
//                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
//                     <p className="text-sm text-blue-800">
//                       Showing cached information
//                     </p>
//                     <button
//                       onClick={handleRefresh}
//                       className="text-sm text-blue-700 hover:text-blue-900 font-medium"
//                     >
//                       Refresh
//                     </button>
//                   </div>
//                 )}

//                 <DetailSection
//                   title="Technical Specifications"
//                   content={details.specifications}
//                 />

//                 {/* <DetailSection
//                   title="Materials & Construction"
//                   content={details.materials}
//                 />

//                 <DetailSection
//                   title="Care & Maintenance"
//                   content={details.care}
//                 /> */}

//                 <DetailSection
//                   title="Warranty Information"
//                   content={details.warranty}
//                 />

//                 <DetailSection
//                   title="Certifications & Compliance"
//                   content={details.certifications}
//                 />

//                 <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
//                   <p className="text-xs text-blue-800">
//                     <strong>Disclaimer:</strong> This information was gathered
//                     using OpenAI technology. Please verify any information with
//                     the manufacturer or reach out to the State Restaurant sales
//                     team for more information.
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="border-t p-6">
//             <button
//               onClick={onClose}
//               className="w-full sm:w-auto px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors"
//             >
//               Close
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function DetailSection({ title, content }: { title: string; content: string }) {
//   const isNotAvailable =
//     content === "Information not available" ||
//     content === "Not available from manufacturer" ||
//     !content ||
//     content.trim() === "";

//   // Clean up the content by removing markdown-style formatting
//   const cleanContent = (text: string) => {
//     return text
//       .replace(/\*\*/g, "") // Remove bold markdown
//       .replace(/^###\s+\d+\.\s*/gm, "") // Remove numbered headers
//       .replace(/^###\s+/gm, "") // Remove other headers
//       .trim();
//   };

//   return (
//     <div className="mb-6">
//       <h3 className="text-base font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
//         {title}
//       </h3>
//       <div
//         className={`text-sm leading-relaxed ${
//           isNotAvailable ? "text-gray-500 italic" : "text-gray-700"
//         }`}
//         style={{ whiteSpace: "pre-line" }}
//       >
//         {isNotAvailable ? "Information not available" : cleanContent(content)}
//       </div>
//     </div>
//   );
// }
