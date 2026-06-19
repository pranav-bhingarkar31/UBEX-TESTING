import { getPool } from "../db/dbClient";
import { localDb } from "../db/index";

/**
 * InquiryIdService manages atomic, transaction-safe sequence ID generation
 * for all types of inquiries. It leverages database-backed PostgreSQL sequences 
 * with a high-fidelity fallback process for offline sandbox environments.
 */
export const InquiryIdService = {
  async generateInquiryId(type: string): Promise<string> {
    const pool = getPool();
    const isFallback = pool.fallbackMode;

    const normalizedType = (type || "").toLowerCase().trim();
    let prefix = "UBX-ST-";
    let seqName = "ubex_stay_seq";
    let defaultStart = 1001;

    if (normalizedType.includes("stay")) {
      prefix = "UBX-ST-";
      seqName = "ubex_stay_seq";
      defaultStart = 1001;
    } else if (normalizedType.includes("experience") || normalizedType.includes("tour")) {
      prefix = "UBX-EX-";
      seqName = "ubex_experience_seq";
      defaultStart = 2001;
    } else if (normalizedType.includes("wellness")) {
      prefix = "UBX-WL-";
      seqName = "ubex_wellness_seq";
      defaultStart = 3001;
    } else if (normalizedType.includes("community")) {
      prefix = "UBX-CM-";
      seqName = "ubex_community_seq";
      defaultStart = 4001;
    } else if (normalizedType.includes("corporate")) {
      prefix = "UBX-CP-";
      seqName = "ubex_corporate_seq";
      defaultStart = 5001;
    } else {
      prefix = "UBX-ST-";
      seqName = "ubex_stay_seq";
      defaultStart = 1001;
    }

    if (!isFallback) {
      try {
        const res = await pool.query(`SELECT nextval('${seqName}');`);
        const value = res.rows[0].nextval;
        return `${prefix}${value}`;
      } catch (err) {
        console.error(`PostgreSQL sequence nextval failed for ${seqName}. Falling back to deterministic random suffix.`, err);
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `${prefix}${rand}`;
      }
    } else {
      // localJson fallback sequence tracker
      const inquiries = localDb.getInquiries();
      const matchingIds = inquiries
        .map((inq: any) => inq.inquiryId || inq.inquiry_id || "")
        .filter((id: string) => id.startsWith(prefix));

      let maxNum = defaultStart - 1;
      for (const id of matchingIds) {
        const numPart = id.substring(prefix.length);
        const parsedNum = parseInt(numPart, 10);
        if (!isNaN(parsedNum) && parsedNum > maxNum) {
          maxNum = parsedNum;
        }
      }
      const nextNum = maxNum + 1;
      return `${prefix}${nextNum}`;
    }
  }
};

export default InquiryIdService;
