import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Badge, Button, Input, Select, Textarea, Dialog, Sheet, Tabs, Alert, Avatar, DropdownMenu } from "../components/ui";
import { DataTable, type Column } from "../components/DataTable";
import { useStore } from "../lib/store";
import { useToast } from "../components/Toast";
import { Icon } from "../components/Sidebar";
import { formatDate, uid } from "../lib/utils";

type SanityDoc = {
  id: string;
  _id: string;
  _type: "drug" | "article" | "department";
  title: string;
  slug: string;
  category?: string;
  body: string;
  author: string;
  status: "published" | "draft" | "archived";
  updatedAt: string;
  imageUrl?: string;
  usage_instructions?: string;
  side_effects?: string;
};

const seedDocs: SanityDoc[] = [
  { id: "san-1", _id: "san-1", _type: "drug", title: "Amoxicillin 500mg", slug: "amoxicillin-500mg", category: "Antibiotic", body: "Broad-spectrum penicillin antibiotic used to treat a variety of bacterial infections.", author: "Pharm. Iris Quinn", status: "published", updatedAt: "2025-03-15T10:00:00Z", usage_instructions: "500mg every 8 hours for 7 days. Take with food.", side_effects: "Nausea, diarrhea, rash. Discontinue if hypersensitivity." },
  { id: "san-2", _id: "san-2", _type: "drug", title: "Atorvastatin 20mg", slug: "atorvastatin-20mg", category: "Statin", body: "Lipid-lowering agent for primary hypercholesterolemia.", author: "Pharm. Iris Quinn", status: "published", updatedAt: "2025-03-18T12:00:00Z", usage_instructions: "20mg once daily in the evening.", side_effects: "Myalgia, elevated liver enzymes, headache." },
  { id: "san-3", _id: "san-3", _type: "drug", title: "Metformin 500mg", slug: "metformin-500mg", category: "Antidiabetic", body: "Biguanide antihyperglycemic for type 2 diabetes.", author: "Pharm. Iris Quinn", status: "published", updatedAt: "2025-03-10T09:00:00Z", usage_instructions: "500mg twice daily with meals.", side_effects: "Gastrointestinal disturbance, metallic taste." },
  { id: "san-4", _id: "san-4", _type: "drug", title: "Omeprazole 20mg", slug: "omeprazole-20mg", category: "Antacid", body: "Proton pump inhibitor for acid-related disorders.", author: "Pharm. Iris Quinn", status: "published", updatedAt: "2025-03-20T08:00:00Z", usage_instructions: "20mg once daily before breakfast.", side_effects: "Headache, diarrhea, nausea." },
  { id: "san-5", _id: "san-5", _type: "drug", title: "Aspirin 75mg", slug: "aspirin-75mg", category: "Analgesic", body: "Antiplatelet analgesic for cardiovascular prevention.", author: "Pharm. Iris Quinn", status: "published", updatedAt: "2025-03-22T14:00:00Z", usage_instructions: "75mg once daily.", side_effects: "Bleeding risk, gastric irritation." },
  { id: "san-6", _id: "san-6", _type: "drug", title: "Sumatriptan 50mg", slug: "sumatriptan-50mg", category: "Antimigraine", body: "Serotonin agonist for acute migraine attacks.", author: "Pharm. Iris Quinn", status: "draft", updatedAt: "2025-03-25T11:00:00Z", usage_instructions: "50mg at onset of migraine attack; may repeat once after 2 hours.", side_effects: "Chest tightness, dizziness, flushing." },
  { id: "san-7", _id: "san-7", _type: "article", title: "Seasonal Flu Prevention Guide 2025", slug: "flu-prevention-2025", body: "Guidelines for vaccination, hygiene, and early treatment during the flu season.", author: "Dr. Hannah Lee", status: "published", updatedAt: "2025-03-01T10:00:00Z" },
  { id: "san-8", _id: "san-8", _type: "article", title: "Understanding Cardiac Rehabilitation", slug: "cardiac-rehab", body: "A patient-facing guide to post-MI cardiac rehabilitation programs.", author: "Dr. Hannah Lee", status: "published", updatedAt: "2025-02-14T10:00:00Z" },
  { id: "san-9", _id: "san-9", _type: "department", title: "Department of Cardiology", slug: "department-cardiology", body: "Specialized care for cardiovascular conditions, 24/7 cath lab.", author: "Dr. Raj Patel", status: "published", updatedAt: "2025-01-20T10:00:00Z" },
  { id: "san-10", _id: "san-10", _type: "department", title: "Department of Neurology", slug: "department-neurology", body: "Comprehensive neurological services including stroke unit.", author: "Dr. Raj Patel", status: "published", updatedAt: "2025-02-05T10:00:00Z" },
];

export default function SanityCMS() {
  const { drugs, setDrugs } = useStore();
  const { toast } = useToast();
  const [docs, setDocs] = React.useState<SanityDoc[]>(seedDocs);
  const [tab, setTab] = React.useState<"drugs" | "articles" | "departments">("drugs");
  const [openDoc, setOpenDoc] = React.useState<SanityDoc | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: "", category: "Antibiotic", body: "", usage: "", sideEffects: "" });

  const tabToType: Record<typeof tab, SanityDoc["_type"]> = { drugs: "drug", articles: "article", departments: "department" };
  const filtered = React.useMemo(() => docs.filter((d) => d._type === tabToType[tab]), [docs, tab, tabToType]);

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const id = "san-" + uid();
    const newDoc: SanityDoc = {
      id,
      _id: id,
      _type: "drug",
      title: form.title,
      slug: form.title.toLowerCase().replace(/\s+/g, "-"),
      category: form.category,
      body: form.body,
      author: "Super Admin",
      status: "published",
      updatedAt: new Date().toISOString(),
      usage_instructions: form.usage,
      side_effects: form.sideEffects,
    };
    setDocs((prev) => [newDoc, ...prev]);
    // Also create matching inventory row (Supabase sync simulation)
    setDrugs((prev) => [...prev, { id: uid(), sanity_drug_id: newDoc._id, drug_name: newDoc.title, category: newDoc.category || "Other", description: newDoc.body, quantity: 0, status: "out of stock", updated_at: newDoc.updatedAt }]);
    toast({ title: "Sanity document created", description: "Inventory row also created (simulated sync).", variant: "success" });
    setCreateOpen(false);
    setForm({ title: "", category: "Antibiotic", body: "", usage: "", sideEffects: "" });
  };

  const toggleStatus = (id: string) => {
    setDocs((prev) => prev.map((d) => d._id === id ? { ...d, status: d.status === "published" ? "draft" : "published", updatedAt: new Date().toISOString() } : d));
    toast({ title: "Document status toggled", variant: "success" });
  };

  const remove = (id: string) => {
    setDocs((prev) => prev.filter((d) => d._id !== id));
    toast({ title: "Document archived", variant: "warning" });
  };

  const drugCols: Column<SanityDoc>[] = [
    { key: "title", header: "Drug", sortable: true, accessor: (r) => (
      <div>
        <div className="font-medium text-slate-800">{r.title}</div>
        <div className="text-xs text-slate-500">slug: /{r.slug}</div>
      </div>
    )},
    { key: "category", header: "Category", accessor: (r) => <Badge variant="info">{r.category}</Badge> },
    { key: "status", header: "Status", sortable: true, accessor: (r) => <Badge variant={r.status === "published" ? "success" : r.status === "draft" ? "warning" : "default"}>{r.status}</Badge> },
    { key: "author", header: "Author", accessor: (r) => <span className="text-sm text-slate-700">{r.author}</span> },
    { key: "updatedAt", header: "Updated", sortable: true, accessor: (r) => <span className="text-xs text-slate-500">{formatDate(r.updatedAt)}</span> },
  ];

  const articleCols: Column<SanityDoc>[] = [
    { key: "title", header: "Article", sortable: true, accessor: (r) => (
      <div>
        <div className="font-medium text-slate-800">{r.title}</div>
        <div className="text-xs text-slate-500">/{r.slug}</div>
      </div>
    )},
    { key: "status", header: "Status", accessor: (r) => <Badge variant={r.status === "published" ? "success" : "warning"}>{r.status}</Badge> },
    { key: "author", header: "Author" },
    { key: "updatedAt", header: "Updated", sortable: true, accessor: (r) => <span className="text-xs text-slate-500">{formatDate(r.updatedAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Studio-like hero */}
      <Card className="relative overflow-hidden">
        <div className="bg-dots absolute inset-0 opacity-60" />
        <CardContent className="relative flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Sanity Studio · Content Lake</h2>
                <Badge variant="warning">Studio v3</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">Structured content for drugs, patient education articles, and department pages. Synced live to Supabase inventory.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm"><Icon.download /> Export schema</Button>
            <Button variant="outline" size="sm"><Icon.search /> Open GROQ query</Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}><Icon.plus /> New document</Button>
          </div>
        </CardContent>
      </Card>

      {/* Schema stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { k: "Drug documents", v: docs.filter((d) => d._type === "drug").length, sub: "synced → drug_inventory" },
          { k: "Articles", v: docs.filter((d) => d._type === "article").length, sub: "patient education" },
          { k: "Departments", v: docs.filter((d) => d._type === "department").length, sub: "public pages" },
          { k: "Linked inventory", v: drugs.length, sub: "Supabase rows" },
        ].map((s) => (
          <Card key={s.k} className="tilt-card">
            <CardContent className="p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.k}</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{s.v}</div>
              <div className="text-xs text-slate-500">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Edit structured content. Drug documents are automatically synced to the pharmacy inventory.</CardDescription>
            </div>
          </div>
          <Tabs
            tabs={[
              { id: "drugs", label: `Drugs (${docs.filter((d) => d._type === "drug").length})` },
              { id: "articles", label: `Articles (${docs.filter((d) => d._type === "article").length})` },
              { id: "departments", label: `Departments (${docs.filter((d) => d._type === "department").length})` },
            ]}
            active={tab}
            onChange={(id) => setTab(id as any)}
          />
        </CardHeader>
        <CardContent>
          {tab === "drugs" && (
            <DataTable
              columns={drugCols}
              data={filtered}
              searchable
              searchKeys={["title", "category", "author"]}
              rowActions={(r) => (
                <div className="flex justify-end gap-1">
                  <Button variant="outline" size="sm" onClick={() => setOpenDoc(r)}>Open</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleStatus(r._id)}>{r.status === "published" ? "Unpublish" : "Publish"}</Button>
                  <DropdownMenu trigger={<Button variant="ghost" size="icon"><Icon.more /></Button>} items={[{ label: "Delete", onClick: () => remove(r._id), danger: true }]} />
                </div>
              )}
            />
          )}
          {tab === "articles" && (
            <DataTable columns={articleCols} data={filtered} searchable searchKeys={["title", "author"]} rowActions={(r) => (
              <div className="flex justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => setOpenDoc(r)}>Open</Button>
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(r._id)}>{r.status === "published" ? "Unpublish" : "Publish"}</Button>
              </div>
            )} />
          )}
          {tab === "departments" && (
            <DataTable columns={articleCols} data={filtered} searchable searchKeys={["title"]} rowActions={(r) => (
              <div className="flex justify-end gap-1">
                <Button variant="outline" size="sm" onClick={() => setOpenDoc(r)}>Open</Button>
              </div>
            )} />
          )}
        </CardContent>
      </Card>

      {/* Sync log */}
      <Card>
        <CardHeader><CardTitle>Sanity ↔ Supabase sync log</CardTitle><CardDescription>Webhook events that keep content and inventory aligned.</CardDescription></CardHeader>
        <CardContent className="space-y-2">
          {[
            { at: "2 min ago", msg: "document.update · drug: Sumatriptan 50mg → inventory row updated (qty 6 → low)", ok: true },
            { at: "18 min ago", msg: "document.create · drug: Omeprazole 20mg → new inventory row created", ok: true },
            { at: "1 hour ago", msg: "document.publish · article: Flu Prevention 2025", ok: true },
            { at: "3 hours ago", msg: "document.unpublish · drug: Metformin 500mg → inventory status: out of stock", ok: true },
          ].map((l, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-4 py-2.5">
              <div className="flex items-center gap-3">
                <Badge variant={l.ok ? "success" : "danger"}>{l.ok ? "200" : "500"}</Badge>
                <div className="text-sm text-slate-700 font-mono">{l.msg}</div>
              </div>
              <div className="text-xs text-slate-500">{l.at}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sheet: Document editor */}
      <Sheet open={!!openDoc} onClose={() => setOpenDoc(null)} title={`Edit: ${openDoc?.title || ""}`}>
        {openDoc && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="info">{openDoc._type}</Badge>
              <Badge variant={openDoc.status === "published" ? "success" : "warning"}>{openDoc.status}</Badge>
              <span className="text-xs text-slate-500">ID: {openDoc._id}</span>
            </div>
            <Input label="Title" defaultValue={openDoc.title} />
            <Input label="Slug" defaultValue={"/" + openDoc.slug} />
            {openDoc.category && <Input label="Category" defaultValue={openDoc.category} />}
            <Textarea label="Description / body" defaultValue={openDoc.body} />
            {openDoc.usage_instructions && <Textarea label="Usage instructions" defaultValue={openDoc.usage_instructions} />}
            {openDoc.side_effects && <Textarea label="Side effects" defaultValue={openDoc.side_effects} />}
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Author</div>
              <div className="mt-1 flex items-center gap-2">
                <Avatar name={openDoc.author} />
                <span className="text-sm text-slate-700">{openDoc.author}</span>
                <span className="text-xs text-slate-500">· last updated {formatDate(openDoc.updatedAt)}</span>
              </div>
            </div>
            <Alert variant="info">This editor is a Sanity Studio preview. In production, changes are persisted to Sanity via the Content Lake API and trigger a webhook that writes to Supabase.</Alert>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenDoc(null)}>Close</Button>
              <Button onClick={() => { toast({ title: "Document saved", variant: "success" }); setOpenDoc(null); }}>Publish changes</Button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Dialog: New document */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create new Sanity document"
        footer={<><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={create as any}>Create &amp; sync</Button></>}
      >
        <form onSubmit={create} className="space-y-3">
          <Input label="Drug name" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Paracetamol 500mg" />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={["Antibiotic", "Statin", "Antidiabetic", "Antacid", "Analgesic", "Antimigraine", "Other"].map((c) => ({ value: c, label: c }))} />
          <Textarea label="Description" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <Textarea label="Usage instructions" value={form.usage} onChange={(e) => setForm({ ...form, usage: e.target.value })} />
          <Textarea label="Side effects" value={form.sideEffects} onChange={(e) => setForm({ ...form, sideEffects: e.target.value })} />
          <Alert variant="info">Creating a drug document also creates a matching inventory row in Supabase (simulated).</Alert>
        </form>
      </Dialog>
    </div>
  );
}
