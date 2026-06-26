import { useState } from "react";
import { useHospital } from "../lib/store";
import {
  Card, CardContent, CardHeader, CardTitle, Badge, Button,
  Input, Label, Textarea,
} from "../components/ui/primitives";
import {
  Search, Plus, FileText, Save, Eye, Pill,
  ChevronRight, Settings, Users as UsersIcon, Puzzle, BookOpen,
} from "lucide-react";
import { format } from "date-fns";

type SanityField =
  | { name: string; type: "string"; title: string; description?: string }
  | { name: string; type: "text"; title: string; description?: string }
  | { name: string; type: "number"; title: string; description?: string }
  | { name: string; type: "reference"; title: string; to: string; description?: string };

interface SanitySchemaType {
  name: string;
  title: string;
  icon: React.ReactNode;
  fields: SanityField[];
}

const drugSchema: SanitySchemaType = {
  name: "drug",
  title: "Drug",
  icon: <Pill size={14} />,
  fields: [
    { name: "drug_name", type: "string", title: "Drug name", description: "Generic or brand name with dosage" },
    { name: "category", type: "string", title: "Category", description: "Therapeutic category (e.g. Analgesic, Antimalarial)" },
    { name: "description", type: "text", title: "Description", description: "Short clinical description" },
    { name: "usage", type: "text", title: "Usage instructions", description: "Dosage and administration" },
    { name: "side_effects", type: "text", title: "Side effects", description: "Common adverse effects" },
    { name: "quantity", type: "number", title: "Initial stock quantity" },
  ],
};

const schemaTypes: SanitySchemaType[] = [drugSchema];

export function SanityCmsPage() {
  const { drugs, addDrug, updateDrugQty } = useHospital();
  const [selectedType, setSelectedType] = useState<string>("drug");
  const [selectedDocId, setSelectedDocId] = useState<string | null>(drugs[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);

  const filtered = drugs.filter((d) =>
    d.drug_name.toLowerCase().includes(search.toLowerCase()) ||
    d.category.toLowerCase().includes(search.toLowerCase())
  );
  const current = drugs.find((d) => d.id === selectedDocId) ?? null;

  const startEdit = (doc: typeof drugs[0]) => {
    setSelectedDocId(doc.id);
    setForm({
      drug_name: doc.drug_name,
      category: doc.category,
      description: doc.description,
      usage: doc.usage,
      side_effects: doc.side_effects,
      quantity: doc.quantity,
    });
    setDirty(false);
  };

  const openNew = () => {
    setForm({ drug_name: "", category: "", description: "", usage: "", side_effects: "", quantity: 0 });
    setSelectedDocId("__new__");
    setDirty(true);
  };

  const saveDoc = () => {
    if (selectedDocId === "__new__") {
      addDrug({
        drug_name: form.drug_name || "Untitled drug",
        category: form.category || "",
        description: form.description || "",
        usage: form.usage || "",
        side_effects: form.side_effects || "",
        quantity: parseInt(form.quantity) || 0,
      });
    } else if (current) {
      updateDrugQty(current.id, parseInt(form.quantity) || 0);
    }
    setDirty(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] -m-6 flex flex-col animate-float-up">
      {/* Sanity Studio-style top bar */}
      <div className="h-12 bg-white border-b border-neutral-200 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-red-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15H9V7h4a3 3 0 0 1 0 6h-2v4z"/></svg>
          </div>
          <span className="text-sm font-semibold text-neutral-900">Sanity Studio</span>
          <span className="text-xs text-neutral-400 mx-2">·</span>
          <span className="text-xs text-neutral-600">satcity-hospital</span>
          <span className="text-xs text-neutral-400 mx-2">·</span>
          <span className="text-xs text-neutral-600">production</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <Badge variant="success">Connected</Badge>
          <span>Project ID: <span className="font-mono">stc-hosp-prod</span></span>
        </div>
      </div>

      {/* Main Studio layout */}
      <div className="flex-1 flex overflow-hidden bg-neutral-50">
        {/* Left: Schema types sidebar */}
        <aside className="w-60 bg-white border-r border-neutral-200 flex flex-col">
          <div className="p-3 border-b border-neutral-200">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input placeholder="Search content..." className="h-8 pl-8 text-xs" />
            </div>
          </div>
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold mb-2">Content</div>
            <nav className="space-y-0.5">
              {schemaTypes.map((t) => (
                <button
                  key={t.name}
                  onClick={() => setSelectedType(t.name)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs cursor-pointer ${selectedType === t.name ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}
                >
                  {t.icon}
                  <span className="flex-1 text-left">{t.title}</span>
                  <span className={`text-[10px] ${selectedType === t.name ? "text-white/70" : "text-neutral-400"}`}>{drugs.length}</span>
                </button>
              ))}
            </nav>
            <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold mt-5 mb-2">Coming soon</div>
            <div className="space-y-0.5 opacity-50">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-600"><BookOpen size={14} /> Health articles</div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-600"><Puzzle size={14} /> Page builder</div>
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-600"><UsersIcon size={14} /> Staff bios</div>
            </div>
            <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold mt-5 mb-2">Tools</div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-600"><Settings size={14} /> Schema settings</div>
            </div>
          </div>
        </aside>

        {/* Middle: Document list */}
        <section className="w-80 bg-white border-r border-neutral-200 flex flex-col">
          <div className="p-3 border-b border-neutral-200 flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input placeholder="Filter documents..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 pl-8 text-xs" />
            </div>
            <Button size="sm" onClick={openNew}><Plus size={12} /> New</Button>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-semibold px-2 py-1">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </div>
            {filtered.map((d) => (
              <button
                key={d.id}
                onClick={() => startEdit(d)}
                className={`w-full text-left p-2.5 rounded-md mb-1 cursor-pointer ${selectedDocId === d.id ? "bg-blue-50 border border-blue-200" : "hover:bg-neutral-50 border border-transparent"}`}
              >
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Pill size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-neutral-900 truncate">{d.drug_name}</div>
                    <div className="text-[11px] text-neutral-500 truncate mt-0.5">{d.category || "No category"}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Badge variant={d.status === "available" ? "success" : d.status === "low" ? "warning" : "danger"}>
                        {d.status === "out_of_stock" ? "Out" : d.status === "low" ? "Low" : "OK"}
                      </Badge>
                      <span className="text-[10px] text-neutral-400">{format(new Date(d.updated_at), "MMM d")}</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-neutral-400 mt-1" />
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-xs text-neutral-500 text-center py-8">No documents match "{search}".</div>
            )}
          </div>
        </section>

        {/* Right: Document editor */}
        <section className="flex-1 bg-neutral-50 overflow-y-auto">
          {!current && selectedDocId !== "__new__" ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-neutral-200 flex items-center justify-center mx-auto">
                  <FileText size={20} className="text-neutral-500" />
                </div>
                <div className="mt-3 text-sm font-medium text-neutral-700">Select a document to edit</div>
                <div className="text-xs text-neutral-500 mt-1">Choose a drug from the list or create a new one.</div>
                <Button size="sm" className="mt-4" onClick={openNew}><Plus size={12} /> Create new drug</Button>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto p-6">
              {/* Editor header */}
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                <span className="capitalize">{drugSchema.title}</span>
                <ChevronRight size={12} />
                <span className="text-neutral-900 font-medium">{form.drug_name || (selectedDocId === "__new__" ? "New document" : "Untitled")}</span>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{form.drug_name || "Untitled document"}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neutral-500">Document ID: <span className="font-mono">{current?.sanity_drug_id ?? "pending"}</span></span>
                      {dirty && <Badge variant="warning">Unpublished changes</Badge>}
                      {!dirty && selectedDocId !== "__new__" && <Badge variant="success">Published</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPreview(!preview)}>
                      <Eye size={12} /> {preview ? "Edit" : "Preview"}
                    </Button>
                    <Button size="sm" onClick={saveDoc} disabled={!dirty}>
                      <Save size={12} /> {selectedDocId === "__new__" ? "Publish" : "Save"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {!preview ? (
                    drugSchema.fields.map((f) => (
                      <div key={f.name}>
                        <Label htmlFor={f.name}>
                          {f.title}
                          {f.name === "drug_name" && <span className="text-red-500 ml-0.5">*</span>}
                        </Label>
                        {f.description && <div className="text-[11px] text-neutral-500 mb-1">{f.description}</div>}
                        {f.type === "string" && (
                          <Input
                            id={f.name}
                            value={form[f.name] ?? ""}
                            onChange={(e) => { setForm({ ...form, [f.name]: e.target.value }); setDirty(true); }}
                          />
                        )}
                        {f.type === "text" && (
                          <Textarea
                            id={f.name}
                            value={form[f.name] ?? ""}
                            onChange={(e) => { setForm({ ...form, [f.name]: e.target.value }); setDirty(true); }}
                          />
                        )}
                        {f.type === "number" && (
                          <Input
                            id={f.name}
                            type="number"
                            value={form[f.name] ?? 0}
                            onChange={(e) => { setForm({ ...form, [f.name]: e.target.value }); setDirty(true); }}
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4 p-4 rounded-lg bg-white border border-neutral-200">
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Drug name</div>
                        <div className="text-lg font-semibold text-neutral-900">{form.drug_name || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Category</div>
                        <div className="text-sm text-neutral-800">{form.category || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Description</div>
                        <div className="text-sm text-neutral-800">{form.description || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Usage instructions</div>
                        <div className="text-sm text-neutral-800">{form.usage || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Side effects</div>
                        <div className="text-sm text-neutral-800">{form.side_effects || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500 uppercase tracking-wide">Initial stock</div>
                        <div className="text-sm text-neutral-800">{form.quantity || 0} units</div>
                      </div>
                    </div>
                  )}

                  {current && selectedDocId !== "__new__" && !preview && (
                    <div className="pt-4 border-t border-neutral-100">
                      <div className="text-xs text-neutral-500 mb-2">Linked Supabase inventory</div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="p-2 rounded-md bg-neutral-50 border border-neutral-200">
                          <div className="text-neutral-500">Inventory ID</div>
                          <div className="font-mono text-neutral-900">{current.id}</div>
                        </div>
                        <div className="p-2 rounded-md bg-neutral-50 border border-neutral-200">
                          <div className="text-neutral-500">Live quantity</div>
                          <div className="font-mono text-neutral-900">{current.quantity}</div>
                        </div>
                        <div className="p-2 rounded-md bg-neutral-50 border border-neutral-200">
                          <div className="text-neutral-500">Status</div>
                          <div className="font-mono text-neutral-900 capitalize">{current.status.replace("_", " ")}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inspector panel */}
              {current && selectedDocId !== "__new__" && (
                <Card className="mt-4">
                  <CardHeader><CardTitle>Document inspector</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="text-[11px] font-mono bg-neutral-900 text-emerald-300 p-3 rounded-lg overflow-x-auto">{JSON.stringify({
                      _id: current.sanity_drug_id,
                      _type: "drug",
                      _createdAt: current.updated_at,
                      _updatedAt: current.updated_at,
                      drug_name: current.drug_name,
                      category: current.category,
                      description: current.description,
                      usage: current.usage,
                      side_effects: current.side_effects,
                      inventory_ref: current.id,
                    }, null, 2)}</pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
