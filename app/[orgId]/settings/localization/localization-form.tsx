"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, RequiredLabel } from "@/components/ui/label";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { ConfirmLeaveDialog } from "@/components/confirm-leave-dialog";
import { useConfirmBeforeLeave } from "@/hooks/use-confirm-before-leave";
import { useOrganization } from "@/hooks/use-organization";
import {
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  CURRENCY_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  COUNTRY_OPTIONS,
  LOCALE_OPTIONS,
} from "./localization-options";
import type { TenantWithRole } from "@/lib/supabase/queries";

interface LocalizationFormProps {
  orgId: string;
  org: TenantWithRole | null;
}

const localeDefaults = {
  timezone: "UTC",
  date_format: "dd/MM/yyyy",
  time_format: "12h" as const,
  currency: "USD",
  currency_symbol: "$",
  number_format: "1,234.56",
  language: "en",
  country: "US",
  locale: "en-US",
};

export function LocalizationForm({ orgId, org }: LocalizationFormProps) {
  const { updateOrg } = useOrganization(orgId);
  const s = org
    ? {
        timezone: org.timezone,
        date_format: org.date_format,
        time_format: org.time_format,
        currency: org.currency,
        currency_symbol: org.currency_symbol,
        number_format: org.number_format,
        language: org.language,
        country: org.country,
        locale: org.locale,
      }
    : localeDefaults;
  const [timezone, setTimezone] = useState(s.timezone);
  const [dateFormat, setDateFormat] = useState(s.date_format);
  const [timeFormat, setTimeFormat] = useState(s.time_format);
  const [currency, setCurrency] = useState(s.currency);
  const [currencySymbol, setCurrencySymbol] = useState(s.currency_symbol);
  const [numberFormat, setNumberFormat] = useState(s.number_format);
  const [language, setLanguage] = useState(s.language);
  const [country, setCountry] = useState(s.country);
  const [locale, setLocale] = useState(s.locale);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await updateOrg.mutateAsync({
        timezone,
        date_format: dateFormat,
        time_format: timeFormat as "12h" | "24h",
        currency,
        currency_symbol: currencySymbol,
        number_format: numberFormat,
        language,
        country,
        locale,
      });
      setMessage({ type: "success", text: "Settings saved." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save." });
    }
  }

  function handleCurrencyChange(value: string) {
    const opt = CURRENCY_OPTIONS.find((o) => o.value === value);
    if (opt) {
      setCurrency(opt.value);
      setCurrencySymbol(opt.symbol);
    }
  }

  const isDirty = useMemo(
    () =>
      timezone !== s.timezone ||
      dateFormat !== s.date_format ||
      timeFormat !== s.time_format ||
      currency !== s.currency ||
      currencySymbol !== s.currency_symbol ||
      numberFormat !== s.number_format ||
      language !== s.language ||
      country !== s.country ||
      locale !== s.locale,
    [
      s.timezone,
      s.date_format,
      s.time_format,
      s.currency,
      s.currency_symbol,
      s.number_format,
      s.language,
      s.country,
      s.locale,
      timezone,
      dateFormat,
      timeFormat,
      currency,
      currencySymbol,
      numberFormat,
      language,
      country,
      locale,
    ]
  );

  const { showLeaveDialog, confirmLeave, cancelLeave } = useConfirmBeforeLeave(isDirty);

  function handleDiscard() {
    setTimezone(s.timezone);
    setDateFormat(s.date_format);
    setTimeFormat(s.time_format);
    setCurrency(s.currency);
    setCurrencySymbol(s.currency_symbol);
    setNumberFormat(s.number_format);
    setLanguage(s.language);
    setCountry(s.country);
    setLocale(s.locale);
    setMessage(null);
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        {/* <CardHeader>
          <CardTitle>Localization</CardTitle>
          <CardDescription>
            Timezone, date/time format, currency, and locale. These settings control platform behavior.
          </CardDescription>
        </CardHeader> */}
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <RequiredLabel htmlFor="timezone">Timezone</RequiredLabel>
              <SearchCombobox
                id="timezone"
                options={[...TIMEZONE_OPTIONS]}
                value={timezone}
                onValueChange={setTimezone}
                placeholder="Search timezone…"
                emptyMessage="No timezone found."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="date_format">Date format</RequiredLabel>
              <SearchCombobox
                id="date_format"
                options={[...DATE_FORMAT_OPTIONS]}
                value={dateFormat}
                onValueChange={setDateFormat}
                placeholder="Search date format…"
                emptyMessage="No format found."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="time_format">Time format</RequiredLabel>
              <SearchCombobox
                id="time_format"
                options={[...TIME_FORMAT_OPTIONS]}
                value={timeFormat}
                onValueChange={(v) => setTimeFormat(v as "12h" | "24h")}
                placeholder="Search time format…"
                emptyMessage="No format found."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="currency">Currency</RequiredLabel>
              <SearchCombobox
                id="currency"
                options={[...CURRENCY_OPTIONS]}
                value={currency}
                onValueChange={handleCurrencyChange}
                placeholder="Search currency…"
                emptyMessage="No currency found."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency_symbol">Currency symbol</Label>
              <SearchCombobox
                id="currency_symbol"
                options={CURRENCY_OPTIONS.map((o) => ({
                  value: o.symbol,
                  label: `${o.symbol} (${o.value})`,
                }))}
                value={currencySymbol}
                onValueChange={setCurrencySymbol}
                placeholder="Search symbol…"
                emptyMessage="No symbol found."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="number_format">Number format</RequiredLabel>
              <SearchCombobox
                id="number_format"
                options={[...NUMBER_FORMAT_OPTIONS]}
                value={numberFormat}
                onValueChange={setNumberFormat}
                placeholder="Search number format…"
                emptyMessage="No format found."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="language">Language</RequiredLabel>
              <SearchCombobox
                id="language"
                options={[...LANGUAGE_OPTIONS]}
                value={language}
                onValueChange={setLanguage}
                placeholder="Search language…"
                emptyMessage="No language found."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="country">Country</RequiredLabel>
              <SearchCombobox
                id="country"
                options={[...COUNTRY_OPTIONS]}
                value={country}
                onValueChange={setCountry}
                placeholder="Search country…"
                emptyMessage="No country found."
                className="w-full"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <RequiredLabel htmlFor="locale">Default locale</RequiredLabel>
              <SearchCombobox
                id="locale"
                options={[...LOCALE_OPTIONS]}
                value={locale}
                onValueChange={setLocale}
                placeholder="Search locale…"
                emptyMessage="No locale found."
                className="w-full"
              />
            </div>
          </div>
          {message && (
            <p
              className={
                message.type === "success"
                  ? "text-muted-foreground text-sm"
                  : "text-destructive text-sm"
              }
            >
              {message.text}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="submit" disabled={updateOrg.isPending}>
            {updateOrg.isPending ? "Saving…" : "Save changes"}
          </Button>
          {isDirty && (
            <Button type="button" variant="outline" onClick={handleDiscard} disabled={updateOrg.isPending}>
              Discard
            </Button>
          )}
        </CardFooter>
      </Card>
      <ConfirmLeaveDialog
        open={showLeaveDialog}
        onOpenChange={(open) => {
          if (!open) cancelLeave();
        }}
        onConfirmLeave={confirmLeave}
        onCancel={cancelLeave}
        title="Leave page?"
        description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        leaveLabel="Leave"
        stayLabel="Stay"
      />
    </form>
  );
}
