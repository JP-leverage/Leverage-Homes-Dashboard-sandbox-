--- a/src/LeverageHomesDashboard.jsx	2026-11-09 17:08:02.834175839 +0000
+++ b/src/LeverageHomesDashboard.jsx	2026-11-09 17:08:02.836221600 +0000
@@ -1192,6 +1192,12 @@
   if (/pay\s*per\s*lead|\bppl\b/.test(x)) return "Pay Per Lead";
   if (/web\s*site|website/.test(x)) return "Website";
   return "Other"; };
+// Appointment-type tests for the In-Person / Virtual tiles (Event Type values verified live, see VP FOCUS notes).
+const isInPersonAppt = (r) => /in person/i.test(String(r.eventType ?? ""));
+const isVirtualAppt = (r) => /virtual/i.test(String(r.eventType ?? ""));
+// Show rate for one appointment type — same rule as the all-type Show Rate tile.
+const typeShowRate = (rows, isType) => { const denom = rows.filter((x) => isType(x) && !x.lpAssigned && !apptExcluded(x.outcome));
+  return denom.length ? denom.filter((x) => apptAttended(x.outcome)).length / denom.length : 0; };
 const KPIS = {
   closed_revenue: { id: "closed_revenue", label: "Closed Revenue", dataset: "closed_opps", format: "currency", breakoutRep: "acqManager",
     targetKey: "closed_revenue", targetType: "volume", higherIsBetter: true, agg: (rows) => rows.reduce((s, o) => s + num(o.revenue), 0) },
@@ -1251,6 +1257,25 @@
     compute: (rows) => { const core = rows.filter((x) => !x.lpAssigned);
       const denom = core.filter((x) => !apptExcluded(x.outcome));
       if (!denom.length) return 0; return denom.filter((x) => apptAttended(x.outcome)).length / denom.length; } },
+  // In-Person / Virtual appointment splits. Type comes from the appointment's Event Type
+  // ("In Person Appointment" / "Virtual Appointment"); same sources, date axes, setter credit (Created By)
+  // and exclusions as the all-type Appointments Set / Appts Attended / Show Rate tiles.
+  ip_appts_set: { id: "ip_appts_set", label: "In-Person Appts Set", dataset: "appointments", format: "number", crExcludeNonVp: true,
+    targetKey: "ip_appts_set", targetType: "volume", higherIsBetter: true, qualify: (r) => isInPersonAppt(r), agg: (rows) => rows.length },
+  ip_appts_attended: { id: "ip_appts_attended", label: "In-Person Appts Attended", dataset: "appointments_attended", format: "number", higherIsBetter: true, amFuOnly: true, crExcludeNonVp: true,
+    targetKey: "ip_appts_attended", targetType: "volume",
+    qualify: (r) => isInPersonAppt(r) && !r.lpAssigned && apptAttended(r.outcome), agg: (rows) => rows.length },
+  ip_show_rate: { id: "ip_show_rate", label: "In-Person Show Rate", dataset: "appointments_attended", format: "percent", higherIsBetter: true, amFuOnly: true, targetKey: "ip_show_rate", targetType: "rate",
+    subStat: () => "In-person met ÷ scheduled · excl. cancelled&rescheduled & Listing-Partner appts",
+    compute: (rows) => typeShowRate(rows, isInPersonAppt) },
+  virtual_appts_set: { id: "virtual_appts_set", label: "Virtual Appts Set", dataset: "appointments", format: "number", crExcludeNonVp: true,
+    targetKey: "virtual_appts_set", targetType: "volume", higherIsBetter: true, qualify: (r) => isVirtualAppt(r), agg: (rows) => rows.length },
+  virtual_appts_attended: { id: "virtual_appts_attended", label: "Virtual Appts Attended", dataset: "appointments_attended", format: "number", higherIsBetter: true, amFuOnly: true, crExcludeNonVp: true,
+    targetKey: "virtual_appts_attended", targetType: "volume",
+    qualify: (r) => isVirtualAppt(r) && !r.lpAssigned && apptAttended(r.outcome), agg: (rows) => rows.length },
+  virtual_show_rate: { id: "virtual_show_rate", label: "Virtual Show Rate", dataset: "appointments_attended", format: "percent", higherIsBetter: true, amFuOnly: true, targetKey: "virtual_show_rate", targetType: "rate",
+    subStat: () => "Virtual met ÷ scheduled · excl. cancelled&rescheduled & Listing-Partner appts",
+    compute: (rows) => typeShowRate(rows, isVirtualAppt) },
   leads: { id: "leads", label: "Leads", dataset: "leads", format: "number", domain: "marketing",
     targetKey: "leads", targetType: "volume", higherIsBetter: true, agg: (rows) => rows.length },
   leads_call_center: { id: "leads_call_center", label: "Call Center", dataset: "leads", format: "number", domain: "marketing", targetKey: "leads_call_center", targetType: "volume", higherIsBetter: true,
@@ -1786,7 +1811,7 @@
 
 const CARD_TIERS = {
   lagging: ["closed_revenue", "deals_closed", "avg_deal", "pipeline_forecast", "arip_dealreview", "rev_out_of_arip"],
-  leading: ["opps_to_arip", "opps_created", "leads_claimed", "leads_deaded", "appointments", "appts_attended", "show_rate", "avg_icp_per_appt", "contracts_sent", "opps_assigned", "opps_deaded", "calls", "talk_time", "qcs"],
+  leading: ["opps_to_arip", "opps_created", "leads_claimed", "leads_deaded", "appointments", "appts_attended", "show_rate", "ip_appts_set", "ip_appts_attended", "ip_show_rate", "virtual_appts_set", "virtual_appts_attended", "virtual_show_rate", "contracts_sent", "opps_assigned", "opps_deaded", "calls", "talk_time", "qcs"],
 };
 // The two "revenue moved into stage" tiles on the Transactions tab. Rendered in their own strip with the
 // record-type toggles (front-end / back-end) that filter only these two, and fed skip-imputed Buyer ARIP rows.
@@ -3551,7 +3576,7 @@
   const VP_SECTION_IDS = new Set(["appts_attended", "show_rate", "contracts_sent", "calls", "talk_time", "qcs", "pipeline_forecast", "closed_revenue"]);
   const dropVp = (id) => vpDrill && VP_SECTION_IDS.has(id);
   const showAmFuMetrics = !orgFiltered || isAmFuScope(dir, org); // AM/Follow-Up-only KPIs: company roll-up + AM/FU drilldowns; hidden for VP scopes
-  const allCards = ["closed_revenue", "deals_closed", "avg_deal", "pipeline_forecast", "opps_created", "appointments", "appts_attended", "show_rate", "avg_icp_per_appt", "opps_to_arip", "arip_dealreview", "arip_pullthrough", "rev_out_of_arip", "rev_to_buyer_arip", "rev_to_under_contract", "contracts_sent", "leads", "leads_claimed", "leads_deaded", "leads_call_center", "leads_texting", "leads_website", "leads_direct_mail", "leads_ppl", "reactivated_leads", "mkt_opps_created", "avg_lead_icp", "opps_assigned", "opps_deaded", "calls", "talk_time", "qcs", "live_transfers_attempted", "live_transfers_connected"];
+  const allCards = ["closed_revenue", "deals_closed", "avg_deal", "pipeline_forecast", "opps_created", "appointments", "appts_attended", "show_rate", "ip_appts_set", "ip_appts_attended", "ip_show_rate", "virtual_appts_set", "virtual_appts_attended", "virtual_show_rate", "opps_to_arip", "arip_dealreview", "arip_pullthrough", "rev_out_of_arip", "rev_to_buyer_arip", "rev_to_under_contract", "contracts_sent", "leads", "leads_claimed", "leads_deaded", "leads_call_center", "leads_texting", "leads_website", "leads_direct_mail", "leads_ppl", "reactivated_leads", "mkt_opps_created", "avg_lead_icp", "opps_assigned", "opps_deaded", "calls", "talk_time", "qcs", "live_transfers_attempted", "live_transfers_connected"];
   const cards = isTxView ? ["deals_closed", "closed_revenue", "avg_deal", "pipeline_forecast", "arip_pullthrough", "rev_out_of_arip", "rev_to_buyer_arip", "rev_to_under_contract"]
     : allCards.filter((id) => {
         if (isMktView) return KPIS[id].domain === "marketing";
