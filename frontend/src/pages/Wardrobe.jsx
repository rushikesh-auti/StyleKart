import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import { bagActions } from "../store/bagSlice";
import { userFetch } from "../utils/userApi";
import getProductImageUrl from "../utils/productImageUrl";

const OCCASIONS = [
  "college",
  "office",
  "interview",
  "casual outing",
  "party",
  "wedding",
];
const CATEGORIES = [
  "shirts",
  "t-shirts",
  "tops",
  "trousers",
  "jeans",
  "skirts",
  "dresses",
  "shoes",
  "jackets",
  "accessories",
  "other",
];
const STYLES = ["casual", "smart-casual", "formal", "festive", "athletic"];
const EMPTY_FORM = {
  name: "",
  category: "shirts",
  color: "",
  secondaryColor: "",
  style: "casual",
  occasions: [],
  brand: "",
  notes: "",
  image: "",
  imagePublicId: "",
};
const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100";
const labelClass = "grid gap-2 text-sm font-bold text-slate-700";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const Wardrobe = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const queryProductId = searchParams.get("product") || "";
  const [items, setItems] = useState([]);
  const [savedOutfits, setSavedOutfits] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [occasion, setOccasion] = useState("college");
  const [budget, setBudget] = useState("5000");
  const [selectedProductId, setSelectedProductId] = useState(queryProductId);
  const [plans, setPlans] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [scoringFormula, setScoringFormula] = useState("");
  const [versatilityEstimate, setVersatilityEstimate] = useState(null);
  const [activePlanId, setActivePlanId] = useState("");
  const [variantSelections, setVariantSelections] = useState({});
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cartSubmitting, setCartSubmitting] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [wardrobeData, savedData] = await Promise.all([
          userFetch("/wardrobe?limit=100"),
          userFetch("/wardrobe/saved"),
        ]);
        if (active) {
          setItems(wardrobeData.items || []);
          setSavedOutfits(savedData.outfits || []);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSelectedProductId(queryProductId);
  }, [queryProductId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId("");
    setImageFile(null);
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const toggleOccasion = (value) => {
    setForm((current) => ({
      ...current,
      occasions: current.occasions.includes(value)
        ? current.occasions.filter((entry) => entry !== value)
        : [...current.occasions, value],
    }));
  };

  const editItem = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name || "",
      category: item.category || "other",
      color: item.color || "",
      secondaryColor: item.secondaryColor || "",
      style: item.style || "casual",
      occasions: item.occasions || [],
      brand: item.brand || "",
      notes: item.notes || "",
      image: item.image || "",
      imagePublicId: item.imagePublicId || "",
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitItem = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setSaving(true);
    try {
      let image = form.image;
      let imagePublicId = form.imagePublicId;
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);
        const uploaded = await userFetch("/wardrobe/upload", {
          method: "POST",
          body: uploadData,
        });
        image = uploaded.image.secure_url;
        imagePublicId = uploaded.image.public_id;
      }
      const itemData = { ...form, image, imagePublicId };
      const response = await userFetch(
        editingId ? `/wardrobe/${editingId}` : "/wardrobe",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(itemData),
        },
      );
      setItems((current) =>
        editingId
          ? current.map((item) => (item._id === editingId ? response.item : item))
          : [response.item, ...current],
      );
      resetForm();
      setNotice(editingId ? "Wardrobe item updated." : "Wardrobe item added.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Remove ${item.name} from your wardrobe?`)) return;
    setError("");
    setNotice("");
    try {
      await userFetch(`/wardrobe/${item._id}`, { method: "DELETE" });
      setItems((current) => current.filter((entry) => entry._id !== item._id));
      setNotice("Wardrobe item removed.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const generatePlans = async (productId = selectedProductId) => {
    setError("");
    setNotice("");
    setPlanning(true);
    try {
      const data = await userFetch("/wardrobe/plans", {
        method: "POST",
        body: JSON.stringify({
          occasion,
          budget: Number(budget),
          ...(productId ? { selectedProductId: productId } : {}),
        }),
      });
      setPlans(data.plans || []);
      setGaps(data.gaps || []);
      setScoringFormula(data.scoringFormula || "");
      setVersatilityEstimate(data.versatilityEstimate || null);
      setActivePlanId(data.plans?.[0]?.id || "");
      setSelectedProductId(productId);
      if (!data.plans?.length) {
        setNotice(
          "No complete outfit fits this budget with the current wardrobe and available catalog. Review the gaps below or adjust your budget.",
        );
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPlanning(false);
    }
  };

  const selectedPlan = plans.find((plan) => plan.id === activePlanId);

  const savePlan = async (plan) => {
    setError("");
    setNotice("");
    setSaving(true);
    try {
      await userFetch("/wardrobe/saved", {
        method: "POST",
        body: JSON.stringify({
          name: `${occasion[0].toUpperCase()}${occasion.slice(1)} outfit`,
          occasion,
          budget: Number(budget),
          wardrobeItemIds: plan.ownedItems.map((item) => item._id),
          productIds: plan.purchaseItems.map((product) => product.id),
        }),
      });
      const response = await userFetch("/wardrobe/saved");
      setSavedOutfits(response.outfits || []);
      setNotice("Outfit saved to your wardrobe planner.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const removeSavedOutfit = async (outfitId) => {
    setError("");
    try {
      await userFetch(`/wardrobe/saved/${outfitId}`, { method: "DELETE" });
      setSavedOutfits((current) => current.filter((outfit) => outfit._id !== outfitId));
      setNotice("Saved outfit removed.");
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const selectionFor = (planId, productId) =>
    variantSelections[`${planId}:${productId}`] || { size: "", color: "" };

  const updateSelection = (planId, productId, key, value) => {
    const selectionKey = `${planId}:${productId}`;
    setVariantSelections((current) => ({
      ...current,
      [selectionKey]: { ...current[selectionKey], [key]: value },
    }));
  };

  const addPlanToCart = async (plan) => {
    const missingSelection = plan.purchaseItems.find((product) => {
      const selection = selectionFor(plan.id, product.id);
      return (
        (product.sizes?.length && !selection.size) ||
        (product.colors?.length && !selection.color)
      );
    });
    if (missingSelection) {
      setError(`Select a size and color for ${missingSelection.item_name} first.`);
      return;
    }

    setError("");
    setNotice("");
    setCartSubmitting(plan.id);
    let addedCount = 0;
    try {
      for (const product of plan.purchaseItems) {
        const selection = selectionFor(plan.id, product.id);
        await dispatch(
          bagActions.addToBag({
            productId: product.id,
            quantity: 1,
            selectedSize: selection.size || "",
            selectedColor: selection.color || "",
          }),
        ).unwrap();
        addedCount += 1;
      }
      setNotice(
        addedCount
          ? `${addedCount} new catalog item(s) added to your existing cart.`
          : "This outfit uses only items already in your wardrobe.",
      );
    } catch (requestError) {
      setError(
        addedCount
          ? `${addedCount} item(s) were added, but the next cart request failed: ${requestError.message || "Please review your cart."}`
          : requestError.message || "Unable to add this outfit to your cart.",
      );
    } finally {
      setCartSubmitting("");
    }
  };

  const outfitLabel = (outfit) =>
    `${outfit.occasion[0].toUpperCase()}${outfit.occasion.slice(1)} · ${new Date(outfit.createdAt).toLocaleDateString()}`;

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[50vh] max-w-7xl place-items-center px-4 text-lg font-bold text-slate-600">
        Loading your wardrobe...
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 pb-28 sm:px-6 lg:px-8">
      <header className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 px-6 py-8 text-white sm:px-10 sm:py-10">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-200">
          StyleKart wardrobe intelligence
        </p>
        <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
          Build more outfits around what you already own.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
          Save your wardrobe, plan for an occasion, and see real in-stock catalog
          items only where they complete a look.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
          <a href="#planner" className="rounded-xl bg-white px-4 py-2.5 text-slate-950">
            Plan an outfit
          </a>
          <a href="#wardrobe" className="rounded-xl border border-white/30 px-4 py-2.5 text-white">
            Manage wardrobe
          </a>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          {notice}
        </p>
      )}

      <section id="wardrobe" className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
                Your private closet
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Wardrobe overview <span className="text-slate-400">({items.length})</span>
              </h2>
            </div>
            <a href="#add-item" className="text-sm font-black text-brand-700">
              + Add an item
            </a>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <h3 className="text-lg font-black text-slate-900">Start with one item you love</h3>
              <p className="mt-2 text-sm text-slate-500">
                Add clothing you own. It stays private and is never treated as store stock.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <article key={item._id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="h-48 w-full bg-slate-100 object-cover" />
                  ) : (
                    <div className="grid h-48 place-items-center bg-gradient-to-br from-brand-50 to-slate-100 text-sm font-bold text-slate-400">
                      No photo added
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-slate-950">{item.name}</h3>
                        <p className="mt-1 text-xs font-bold capitalize text-slate-500">
                          {item.category} · {item.color}{item.secondaryColor ? ` / ${item.secondaryColor}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-black capitalize text-brand-700">
                        {item.style}
                      </span>
                    </div>
                    {item.occasions?.length > 0 && (
                      <p className="mt-2 text-xs capitalize text-slate-500">{item.occasions.join(" · ")}</p>
                    )}
                    <div className="mt-4 flex gap-2">
                      <button type="button" onClick={() => editItem(item)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteItem(item)} className="rounded-lg px-3 py-2 text-xs font-black text-rose-600 hover:bg-rose-50">
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <section id="add-item" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">
              {editingId ? "Update your closet" : "Grow your closet"}
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-950">
              {editingId ? "Edit wardrobe item" : "Add a wardrobe item"}
            </h2>
          </div>
          <form className="grid gap-4" onSubmit={submitItem}>
            <label className={labelClass}>
              Item name
              <input className={fieldClass} name="name" value={form.name} onChange={updateForm} maxLength="100" required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Category
                <select className={fieldClass} name="category" value={form.category} onChange={updateForm}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                Style
                <select className={fieldClass} name="style" value={form.style} onChange={updateForm}>
                  {STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClass}>
                Main color
                <input className={fieldClass} name="color" value={form.color} onChange={updateForm} maxLength="40" required />
              </label>
              <label className={labelClass}>
                Second color <span className="font-normal text-slate-400">(optional)</span>
                <input className={fieldClass} name="secondaryColor" value={form.secondaryColor} onChange={updateForm} maxLength="40" />
              </label>
            </div>
            <label className={labelClass}>
              Suitable occasions
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((entry) => (
                  <button key={entry} type="button" onClick={() => toggleOccasion(entry)} className={`rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${form.occasions.includes(entry) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-300 text-slate-500"}`}>
                    {entry}
                  </button>
                ))}
              </div>
            </label>
            <label className={labelClass}>
              Brand <span className="font-normal text-slate-400">(optional)</span>
              <input className={fieldClass} name="brand" value={form.brand} onChange={updateForm} maxLength="80" />
            </label>
            <label className={labelClass}>
              Notes <span className="font-normal text-slate-400">(optional)</span>
              <textarea className={`${fieldClass} min-h-20 resize-y`} name="notes" value={form.notes} onChange={updateForm} maxLength="500" />
            </label>
            <label className={labelClass}>
              Photo <span className="font-normal text-slate-400">(JPEG, PNG or WebP, up to 4 MB)</span>
              <input
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
            </label>
            {form.image && !imageFile && (
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2">
                <img src={form.image} alt="" className="h-14 w-12 rounded-lg object-cover" />
                <span className="text-xs font-bold text-slate-500">Saved Cloudinary photo</span>
                <button type="button" onClick={() => setForm((current) => ({ ...current, image: "", imagePublicId: "" }))} className="ml-auto text-xs font-black text-rose-600">Remove</button>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-50">
                {saving ? "Saving..." : editingId ? "Save changes" : "Add to wardrobe"}
              </button>
              {editingId && <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600">Cancel</button>}
            </div>
          </form>
        </section>
      </section>

      <section id="planner" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">Occasion readiness</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">Plan around what you own</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Existing items are reused first. New purchases are suggested only for missing outfit categories and use current in-stock catalog prices.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className={labelClass}>
              Occasion
              <select className={fieldClass} value={occasion} onChange={(event) => setOccasion(event.target.value)}>
                {OCCASIONS.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </label>
            <label className={labelClass}>
              Budget
              <input className={fieldClass} type="number" min="0" max="1000000" step="100" value={budget} onChange={(event) => setBudget(event.target.value)} />
            </label>
            <button type="button" onClick={() => generatePlans()} disabled={planning} className="self-end rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-700 disabled:opacity-50">
              {planning ? "Planning..." : "Find outfits"}
            </button>
          </div>
        </div>

        {selectedProductId && (
          <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800">
            The selected catalog product will be included in generated combinations.{" "}
            <button type="button" className="underline" onClick={() => setSelectedProductId("")}>Remove selection</button>
          </p>
        )}

        {versatilityEstimate && (
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <strong className="text-slate-900">Versatility estimate:</strong>{" "}
            {versatilityEstimate.count} distinct valid combination(s) generated from your saved wardrobe and today&apos;s in-stock catalog. This is not a prediction of actual future wear.
          </p>
        )}

        {plans.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-950">Outfit options ({plans.length})</h3>
              {scoringFormula && (
                <details className="max-w-xl text-xs text-slate-500">
                  <summary className="cursor-pointer font-bold text-brand-700">How the value score works</summary>
                  <p className="mt-2 leading-5">{scoringFormula}</p>
                </details>
              )}
            </div>
            <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
              <div className="flex gap-2 overflow-x-auto xl:flex-col">
                {plans.map((plan, index) => (
                  <button key={plan.id} type="button" onClick={() => setActivePlanId(plan.id)} className={`min-w-56 rounded-xl border p-3 text-left transition xl:min-w-0 ${activePlanId === plan.id ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                    <span className="block text-xs font-black uppercase text-brand-700">Option {index + 1}</span>
                    <span className="mt-1 block text-sm font-bold text-slate-900">{plan.purchaseItems.length ? `${plan.purchaseItems.length} purchase(s)` : "Use your wardrobe"}</span>
                    <span className="mt-1 block text-xs text-slate-500">New spend: {money(plan.newPurchaseTotal)}</span>
                  </button>
                ))}
              </div>

              {selectedPlan && (
                <article className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase capitalize tracking-wide text-brand-700">{selectedPlan.occasion} · {selectedPlan.style}</p>
                      <h4 className="mt-1 text-xl font-black text-slate-950">A considered combination</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase text-slate-400">New purchases only</p>
                      <p className="text-xl font-black text-slate-950">{money(selectedPlan.newPurchaseTotal)}</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    <section>
                      <h5 className="mb-3 text-sm font-black text-slate-900">Already in your wardrobe</h5>
                      {selectedPlan.ownedItems.length ? (
                        <div className="grid gap-2">
                          {selectedPlan.ownedItems.map((item) => (
                            <div key={item._id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
                              {item.image ? <img src={item.image} alt="" className="h-12 w-10 rounded-md object-cover" /> : <span className="grid h-12 w-10 place-items-center rounded-md bg-white text-[10px] text-slate-400">Owned</span>}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                                <p className="text-xs capitalize text-slate-500">{item.category} · {item.color}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No saved items needed for this combination.</p>
                      )}
                    </section>
                    <section>
                      <h5 className="mb-3 text-sm font-black text-slate-900">Catalog items to buy</h5>
                      {selectedPlan.purchaseItems.length ? (
                        <div className="grid gap-3">
                          {selectedPlan.purchaseItems.map((product) => {
                            const selection = selectionFor(selectedPlan.id, product.id);
                            return (
                              <div key={product.id} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex gap-3">
                                  <Link to={`/product/${product.id}`} className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                    <img src={getProductImageUrl(product.image)} alt={product.item_name} className="h-full w-full object-cover" />
                                  </Link>
                                  <div className="min-w-0 flex-1">
                                    <Link to={`/product/${product.id}`} className="line-clamp-2 text-sm font-black text-slate-900 hover:text-brand-700">{product.item_name}</Link>
                                    <p className="mt-1 font-black text-slate-900">{money(product.current_price)}</p>
                                    <p className="text-xs font-bold text-emerald-700">In stock · value score {product.valueScore || selectedPlan.valueScore}/100</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {product.sizes?.length > 0 && (
                                    <select className={`${fieldClass} min-w-28 flex-1`} aria-label={`Select size for ${product.item_name}`} value={selection.size} onChange={(event) => updateSelection(selectedPlan.id, product.id, "size", event.target.value)}>
                                      <option value="">Select size</option>
                                      {product.sizes.map((size) => <option key={size} value={size}>{size}</option>)}
                                    </select>
                                  )}
                                  {product.colors?.length > 0 && (
                                    <select className={`${fieldClass} min-w-28 flex-1`} aria-label={`Select color for ${product.item_name}`} value={selection.color} onChange={(event) => updateSelection(selectedPlan.id, product.id, "color", event.target.value)}>
                                      <option value="">Select color</option>
                                      {product.colors.map((color) => <option key={color} value={color}>{color}</option>)}
                                    </select>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">No purchase needed for this plan.</p>
                      )}
                    </section>
                  </div>
                  {selectedPlan.explanations.length > 0 && (
                    <div className="mt-5 rounded-xl bg-brand-50 p-4">
                      <h5 className="text-sm font-black text-brand-900">Why these picks</h5>
                      <ul className="mt-2 grid gap-1.5 text-sm text-brand-900">
                        {selectedPlan.explanations.flatMap((entry) => entry.reasons.map((reason) => <li key={`${entry.productId}:${reason}`}>• {reason}</li>))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-4 text-xs leading-5 text-slate-500">
                    Value score: {selectedPlan.valueScore}/100 · This is a rule-based estimate using generated valid combinations, wardrobe complement, occasion fit, budget, and stock.
                    {selectedPlan.purchaseItems.length > 0 && ` Versatility estimate: ${selectedPlan.versatilityEstimate} generated combination(s) include at least one selected purchase.`}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => savePlan(selectedPlan)} disabled={saving} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                      {saving ? "Saving..." : "Save outfit"}
                    </button>
                    <button type="button" onClick={() => addPlanToCart(selectedPlan)} disabled={Boolean(cartSubmitting)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-600 disabled:opacity-50">
                      {cartSubmitting === selectedPlan.id ? "Adding..." : selectedPlan.purchaseItems.length ? "Add purchases to cart" : "No purchase needed"}
                    </button>
                  </div>
                </article>
              )}
            </div>
          </div>
        )}

        {gaps.length > 0 && (
          <section className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-black text-slate-950">Wardrobe gaps for {occasion}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {gaps.map((gap) => (
                <article key={gap.category} className="rounded-xl border border-slate-200 p-4">
                  <h4 className="font-black capitalize text-slate-900">{gap.category} needed</h4>
                  <p className="mt-1 text-xs text-slate-500">{gap.explanation}</p>
                  {gap.recommendations.length ? (
                    <div className="mt-3 grid gap-3">
                      {gap.recommendations.slice(0, 3).map((product) => (
                        <div key={product.id} className="flex gap-3 rounded-lg bg-slate-50 p-2">
                          <img src={getProductImageUrl(product.image)} alt="" className="h-16 w-12 rounded-md object-cover" />
                          <div className="min-w-0 flex-1">
                            <Link to={`/product/${product.id}`} className="line-clamp-1 text-sm font-bold text-slate-900">{product.item_name}</Link>
                            <p className="mt-1 text-sm font-black">{money(product.current_price)}</p>
                            <p className="text-xs text-slate-500">{product.reasons[0]}</p>
                            <button type="button" className="mt-1 text-xs font-black text-brand-700" onClick={() => generatePlans(product.id)}>Plan with this item</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-bold text-amber-800">
                      No in-stock catalog item in budget fits this gap right now. Try a higher budget or another occasion.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </section>

      <section id="saved-outfits" className="scroll-mt-24">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-600">Your saved combinations</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Saved outfits ({savedOutfits.length})</h2>
        </div>
        {savedOutfits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
            Saved outfits will appear here. Plans keep references to your wardrobe items and catalog products; unavailable or removed items are labeled when revisited.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savedOutfits.map((outfit) => (
              <article key={outfit._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-950">{outfit.name}</h3>
                    <p className="mt-1 text-xs capitalize text-slate-500">{outfitLabel(outfit)} · budget {money(outfit.budget)}</p>
                  </div>
                  <button type="button" onClick={() => removeSavedOutfit(outfit._id)} className="text-xs font-black text-rose-600">Remove</button>
                </div>
                <div className="mt-4 grid gap-2">
                  {outfit.wardrobeItems.map((item) => (
                    <p key={item._id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
                      You own: {item.unavailable ? "Wardrobe item removed" : item.name}
                    </p>
                  ))}
                  {outfit.products.map((product) => (
                    <p key={product.id} className={`rounded-lg px-3 py-2 text-xs font-bold ${product.unavailable ? "bg-amber-50 text-amber-800" : "bg-brand-50 text-brand-800"}`}>
                      {product.unavailable ? "Catalog item no longer available" : `Buy: ${product.item_name} · ${money(product.current_price)}${product.stock <= 0 ? " · currently out of stock" : ""}`}
                    </p>
                  ))}
                </div>
                {outfit.products.some((product) => !product.unavailable) && (
                  <p className="mt-3 text-xs text-slate-500">
                    Current catalog total: {money(outfit.products.reduce((sum, product) => sum + (product.unavailable ? 0 : product.current_price), 0))}. Availability and prices can change.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Wardrobe;
