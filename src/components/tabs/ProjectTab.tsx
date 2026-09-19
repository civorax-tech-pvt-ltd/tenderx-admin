"use client";

import { FormCard } from "@/components/ui/FormCard";
import { SelectField, TextField } from "@/components/ui/FormField";
import { useDraftEditor } from "@/lib/draft-editor-context";

export function ProjectTab() {
  const { fieldData } = useDraftEditor();
  const isSingle = fieldData.BID_TYPE === "Single Bidder";

  const authorizedOptions = [fieldData.LEAD_PARTNER_CEO, fieldData.FIRST_PARTNER_CEO, fieldData.SECOND_PARTNER_CEO]
    .filter(Boolean)
    .map((name) => ({ value: name as string, label: name as string }));

  return (
    <div className="flex flex-col gap-4">
      <FormCard title={isSingle ? "Firm's Name" : "JV Name"} subtitle="Auto-suggested from partner short names on the client side.">
        <TextField fieldKey="JV_NAME" label={isSingle ? "Firm's Name" : "JV Name"} span={2} />
        <TextField fieldKey="JV_ADDRESS" label="JV Address" span={2} />
      </FormCard>

      <FormCard title="Tender Details">
        <TextField fieldKey="PROJECT_NAME" label="Project Name" span={2} />
        <TextField fieldKey="IFB_NUMBER" label="IFB Number" />
        <TextField fieldKey="BID_DATE" label="Bid Date" type="date" />
        <TextField fieldKey="BID_VALIDITY_PERIOD" label="Bid Validity Period" />
      </FormCard>

      <FormCard title="Employer">
        <TextField fieldKey="EMPLOYER_NAME" label="Employer Name" span={2} />
        <TextField fieldKey="EMPLOYER_ADDRESS" label="Employer Address" span={2} />
      </FormCard>

      <FormCard title="Authorised Signatory">
        <SelectField fieldKey="AUTHORIZED_PERSON_NAME" label="Authorized Person" options={authorizedOptions} span={2} />
      </FormCard>
    </div>
  );
}
