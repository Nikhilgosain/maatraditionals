/* eslint-disable @typescript-eslint/no-explicit-any */

import { API_ENDPOINTS } from "@/utils/constant";
import { useLoaderStore } from "@/store/useLoaderStore";
import { postBinary } from "@/lib/service"; // adjust import to your path
import { showAppToast } from "@/utils/SnackbarUtils";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export function useInvoice() {
  const { showLoader, hideLoader } = useLoaderStore();

  const generateInvoice = async (payload: any) => {
    showLoader();
    try {
      const res = await postBinary(API_ENDPOINTS.BASE_API + API_ENDPOINTS.INVOICE, payload);

      // If not OK, read the blob as text to surface the server error
      if (!res.ok) {
        let msg = "";
        try { msg = await res.blob.text(); } catch {}
        throw new Error(msg || `Invoice API failed (${res.status})`);
      }

      // If server forgot Content-Type, sniff by magic number
      const head = await res.blob.slice(0, 5).text().catch(() => "");
      const isPdf =
        res.contentType.includes("application/pdf") || head === "%PDF-";

      if (!isPdf) {
        // Not a PDF — show whatever the server actually returned
        let msg = "";
        try { msg = await res.blob.text(); } catch {}
        throw new Error(msg || "Invalid PDF response");
      }

      downloadBlob(res.blob, `invoice-${payload?.invoiceNo || Date.now()}.pdf`);
        showAppToast("Invoice generated successfully", "success");
      return true;
    } catch (error: any) {
      console.error("Error generating invoice:", error);
      showAppToast(
        error?.message || "Failed to generate invoice",
        "error",
      );
      return false;
    } 
    finally {
      hideLoader();
    }
  };

  return { generateInvoice };
}
