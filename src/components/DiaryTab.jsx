import { createWorker } from "tesseract.js";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

// Verified Local Database para sa mabilisang auto-fill
const VERIFIED_FOOD_DATABASE = [
  { id: "lib_white_rice", name: "White Rice (Cooked)", cal: 205, serving: "1.0 cup", p: 4, c: 45, f: 0.4 },
  { id: "lib_brown_rice", name: "Brown Rice (Cooked)", cal: 216, serving: "1.0 cup", p: 5, c: 45, f: 1.8 },
  { id: "lib_boiled_egg", name: "Boiled egg", cal: 72, serving: "1.0 egg", p: 6, c: 0.6, f: 5 },
  { id: "lib_fried_egg", name: "Fried egg", cal: 83, serving: "1.0 large", p: 6, c: 0.4, f: 7 },
  { id: "lib_chicken_breast", name: "Chicken Breast (Cooked, Skinless)", cal: 165, serving: "100.0 gram", p: 31, c: 0, f: 3.6 },
  { id: "lib_chicken_adobo", name: "Chicken Adobo", cal: 260, serving: "1 serving (150g)", p: 28, c: 4, f: 14 },
  { id: "lib_pork_sinigang", name: "Pork Sinigang", cal: 220, serving: "1 bowl (200g)", p: 18, c: 6, f: 14 },
  { id: "lib_fried_tilapia", name: "Fried Tilapia", cal: 180, serving: "1 medium fish", p: 26, c: 0, f: 8 },
  { id: "lib_canned_tuna", name: "Canned Tuna (in Water)", cal: 110, serving: "1 can (100g)", p: 25, c: 0, f: 1 },
  { id: "lib_banana", name: "Banana (Lakatan/Latundan)", cal: 105, serving: "1 medium", p: 1.3, c: 27, f: 0.3 },
  { id: "lib_oatmeal", name: "Oatmeal (Cooked)", cal: 150, serving: "1 bowl", p: 5, c: 27, f: 3 },
  { id: "lib_wheat_bread", name: "Whole Wheat Bread", cal: 80, serving: "1 slice", p: 4, c: 14, f: 1 },
  { id: "lib_pandesal", name: "Pandesal", cal: 120, serving: "1 medium pc", p: 3, c: 24, f: 1.5 },
  { id: "lib_monggo", name: "Ginisang Monggo", cal: 190, serving: "1 bowl", p: 12, c: 28, f: 3 },
  { id: "lib_tinola", name: "Chicken Tinola", cal: 210, serving: "1 bowl", p: 24, c: 5, f: 9 }
];

export default function DiaryTab({
  user,
  appData,
  saveToCloud,
  showToast,
  totalCal = 0,
  activeGoal = 2416,
  todayMeals = [],
  deleteMeal
}) {
  const getTodayISO = () => new Date().toLocaleDateString("en-CA");
  const todayISO = getTodayISO();

  // 1. MACRONUTRIENTS COMPUTATION
  const { totalP, totalC, totalF } = useMemo(() => {
    return (todayMeals || []).reduce(
      (acc, m) => ({
        totalP: acc.totalP + (Number(m.p || m.protein) || 0),
        totalC: acc.totalC + (Number(m.c || m.carbs) || 0),
        totalF: acc.totalF + (Number(m.f || m.fat || m.fats) || 0)
      }),
      { totalP: 0, totalC: 0, totalF: 0 }
    );
  }, [todayMeals]);

  const calorieGoal = Number(activeGoal || appData?.dailyCalorieTarget || 2416);
  const targetProtein = Math.round((calorieGoal * 0.3) / 4);
  const targetCarbs = Math.round((calorieGoal * 0.45) / 4);
  const targetFat = Math.round((calorieGoal * 0.25) / 9);

  // 2. MEAL BUCKET SEGREGATION
  const mealBuckets = useMemo(() => {
    const buckets = { breakfast: [], lunch: [], dinner: [], snack: [] };
    (todayMeals || []).forEach((m) => {
      let type = m.mealType;
      if (!type) {
        if (m.timestamp) {
          const hour = new Date(m.timestamp).getHours();
          if (hour >= 4 && hour < 11) type = "breakfast";
          else if (hour >= 11 && hour < 15) type = "lunch";
          else if (hour >= 17 && hour < 22) type = "dinner";
          else type = "snack";
        } else {
          type = "snack";
        }
      }
      if (buckets[type]) buckets[type].push(m);
      else buckets.snack.push(m);
    });
    return buckets;
  }, [todayMeals]);

  const getBucketCalories = (items) => {
    return items.reduce((sum, item) => sum + (Number(item.cal || item.calories) || 0), 0);
  };

  // 3. SLIDE-OVER STATE & PRIMARY FORM
  const [activeModalBucket, setActiveModalBucket] = useState(null);
  const [manualName, setManualName] = useState("");
  const [manualPortion, setManualPortion] = useState("1 serving");
  const [manualCal, setManualCal] = useState("");
  const [manualP, setManualP] = useState("");
  const [manualC, setManualC] = useState("");
  const [manualF, setManualF] = useState("");

  // Portion Scaling Base Memory
  const [baseNutrition, setBaseNutrition] = useState(null);
  const [multiplier, setMultiplier] = useState(1);

  // Suggestions Search Filter
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef(null);

  // 4. BARCODE CAMERA SCANNER STATE & ENGINE
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);
  const [isAnalyzingLabel, setIsAnalyzingLabel] = useState(false);
  const [manualBarcodeCode, setManualBarcodeCode] = useState("");
  const scannerInstanceRef = useRef(null);

  const closeModal = () => {
    setActiveModalBucket(null);
    setManualName("");
    setManualPortion("1 serving");
    setManualCal("");
    setManualP("");
    setManualC("");
    setManualF("");
    setBaseNutrition(null);
    setMultiplier(1);
    setSearchQuery("");
    setIsBarcodeScannerOpen(false);
  };

  // Back Button Intercept
  useEffect(() => {
    if (!activeModalBucket) return;
    window.history.pushState({ diarySlideOverOpen: true }, "");
    const handlePopState = () => closeModal();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeModalBucket]);

  // COMBINED STAPLES & USER PRESETS
  const combinedDatabase = useMemo(() => {
    const userCustoms = (appData?.customQuickStaples || []).map((c) => ({ ...c, isUserCustom: true }));
    return [...VERIFIED_FOOD_DATABASE, ...userCustoms];
  }, [appData?.customQuickStaples]);

  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return combinedDatabase;
    const q = searchQuery.toLowerCase().trim();
    return combinedDatabase.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.serving && f.serving.toLowerCase().includes(q))
    );
  }, [combinedDatabase, searchQuery]);

  // PORTION MULTIPLIER HANDLER
  const handleSelectMultiplier = (scale) => {
    setMultiplier(scale);
    if (baseNutrition) {
      setManualCal(String(Math.round(baseNutrition.cal * scale)));
      setManualP(String(Number((baseNutrition.p * scale).toFixed(1))));
      setManualC(String(Number((baseNutrition.c * scale).toFixed(1))));
      setManualF(String(Number((baseNutrition.f * scale).toFixed(1))));
      setManualPortion(scale === 1 ? baseNutrition.serving : `${scale}x (${baseNutrition.serving})`);
    } else if (manualCal) {
      const c = parseFloat(manualCal) || 0;
      setBaseNutrition({
        cal: c,
        p: parseFloat(manualP) || 0,
        c: parseFloat(manualC) || 0,
        f: parseFloat(manualF) || 0,
        serving: manualPortion || "1 serving"
      });
      setManualCal(String(Math.round(c * scale)));
    }
  };

  // AUTO-FILL FORM FROM SUGGESTIONS
  const handleAutoFillFromSuggestion = (item) => {
    setManualName(item.name);
    setManualPortion(item.serving || "1 serving");
    setManualCal(String(item.cal || ""));
    setManualP(String(item.p || 0));
    setManualC(String(item.c || 0));
    setManualF(String(item.f || 0));

    // Save as base for multipliers
    setBaseNutrition({
      cal: Number(item.cal),
      p: Number(item.p || 0),
      c: Number(item.c || 0),
      f: Number(item.f || 0),
      serving: item.serving || "1 serving"
    });
    setMultiplier(1);

    if (showToast) showToast(`✨ Na-load si "${item.name}" sa form sa itaas!`);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1-TAP QUICK LOG DIRECTLY
  const handleQuickLogSuggestion = (item) => {
    if (!activeModalBucket) return;
    const newMeal = {
      id: Date.now(),
      name: item.name,
      mealType: activeModalBucket,
      portion: item.serving || "1 serving",
      cal: Number(item.cal),
      calories: Number(item.cal),
      p: Number(item.p || 0),
      c: Number(item.c || 0),
      f: Number(item.f || 0),
      dateLogged: todayISO,
      timestamp: Date.now()
    };
    if (saveToCloud) saveToCloud({ ...appData, meals: [newMeal, ...(appData?.meals || [])] });
    if (showToast) showToast(`🍽️ Logged: ${item.name} (+${item.cal} kcal)!`);
    closeModal();
  };

  // OPEN FOOD FACTS API BARCODE LOOKUP
  const lookupBarcodeOnline = async (barcode) => {
    if (!barcode || !barcode.trim()) return;
    setIsFetchingBarcode(true);
    if (showToast) showToast(`🔍 Fetching barcode: ${barcode.trim()}...`);

    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode.trim()}.json`);
      const data = await res.json();

      if (data && data.status === 1 && data.product) {
        const prod = data.product;
        const name = prod.product_name || prod.product_name_en || prod.generic_name || `Scanned (${barcode})`;
        const serving = prod.serving_size || "1 package / serving";
        const n = prod.nutriments || {};

        const cal = Math.round(n["energy-kcal_serving"] || n["energy-kcal_100g"] || n["energy-kcal"] || 0);
        const p = Number((n.proteins_serving || n.proteins_100g || n.proteins || 0).toFixed(1));
        const c = Number((n.carbohydrates_serving || n.carbohydrates_100g || n.carbohydrates || 0).toFixed(1));
        const f = Number((n.fat_serving || n.fat_100g || n.fat || 0).toFixed(1));

        setManualName(name);
        setManualPortion(serving);
        setManualCal(cal > 0 ? String(cal) : "");
        setManualP(String(p));
        setManualC(String(c));
        setManualF(String(f));

        setBaseNutrition({ cal, p, c, f, serving });
        setMultiplier(1);

        if (showToast) showToast(`🎉 Barcode Success: ${name} (${cal} kcal)!`);
        setIsBarcodeScannerOpen(false);

        if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        if (showToast) showToast(`⚠️ Walang produktong tumugma sa barcode ${barcode}. Ilagay nang manual.`);
        setIsBarcodeScannerOpen(false);
      }
    } catch (err) {
      console.error("Barcode API Error:", err);
      if (showToast) showToast("❌ Error sa database connection.");
      setIsBarcodeScannerOpen(false);
    } finally {
      setIsFetchingBarcode(false);
    }
  };

  // CAMERA SCANNER LIFECYCLE
  useEffect(() => {
    if (!isBarcodeScannerOpen) {
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.stop().catch(() => {});
        } catch (e) {}
        scannerInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      try {
        const scanner = new Html5Qrcode("interactive-camera-barcode-region");
        scannerInstanceRef.current = scanner;

        scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 140 } },
          (decoded) => {
            lookupBarcodeOnline(decoded);
            try {
              scanner.stop().catch(() => {});
            } catch (e) {}
          },
          () => {} // Frame error ignore
        ).catch((err) => {
          console.error("Camera access error:", err);
          if (showToast) showToast("⚠️ Camera permission required or unavailable.");
        });
      } catch (e) {
        console.error("Scanner setup failed:", e);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.stop().catch(() => {});
        } catch (e) {}
        scannerInstanceRef.current = null;
      }
    };
  }, [isBarcodeScannerOpen]);

  // CONFIRM & SAVE MANUAL FORM
  
  // ─── 📸 ULTRA-FAST AI NUTRITION VISION SCANNER ───
  const handleNutritionLabelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const apiKey = atob("QVEuQWI4Uk42TFNSdzktdEVtSTRrc2lTcFZlZ0l3UXdlSHo3enVfRzk3dG9YV1hrdGN6Qnc=");
    setIsAnalyzingLabel(true);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000); // 12 seconds max para hindi mabalam

    try {
      // Radical lightweight compression: 600px at 0.50 quality (~15KB - 25KB lang)
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxDim = 600;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.50);
            resolve(dataUrl.split(",")[1]);
          };
          img.onerror = reject;
          img.src = event.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const prompt = "Extract Nutrition Facts from this food packaging image. Return strictly a raw JSON object with keys: foodName (clean dish or snack name), portionSize (e.g. 1 pouch, 30g), calories (number of kcal), protein (grams number), carbs (total carbohydrates in grams number), fat (total fat in grams number). Return ONLY raw JSON without markdown.";

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || response.statusText || "Nabigong kumonekta.");
      }

      const result = await response.json();
      const parts = result?.candidates?.[0]?.content?.parts || [];
      const rawText = parts.map(p => p.text || "").join(" ").trim();
      const match = rawText.match(/\{[\s\S]*\}/);
      const cleanJson = match ? match[0] : rawText.replace(/\`\`\`json/gi, "").replace(/\`\`\`/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.foodName) setManualName(parsed.foodName);
      if (parsed.portionSize) setManualPortion(parsed.portionSize);
      if (parsed.calories !== undefined) setManualCal(String(Math.round(Number(parsed.calories) || 0)));
      if (parsed.protein !== undefined) setManualP(String(Math.round(Number(parsed.protein) || 0)));
      if (parsed.carbs !== undefined) setManualC(String(Math.round(Number(parsed.carbs) || 0)));
      if (parsed.fat !== undefined) setManualF(String(Math.round(Number(parsed.fat) || 0)));

      setBaseNutrition({
        name: parsed.foodName || manualName || "Scanned Food",
        portion: parsed.portionSize || "1 serving",
        calories: Number(parsed.calories) || 0,
        protein: Number(parsed.protein) || 0,
        carbs: Number(parsed.carbs) || 0,
        fat: Number(parsed.fat) || 0
      });
      setMultiplier(1);

      if (showToast) {
        showToast(`✅ Nabasa: ${parsed.foodName || "Pagkain"} (${parsed.calories || 0} kcal)!`);
      }
    } catch (err) {
      console.error("AI Error:", err);
      if (err.name === "AbortError") {
        alert("⚠️ Medyo mahina ang signal ng data. Maaari mong i-type muna ang calories o subukan muli.");
      } else {
        alert("⚠️ Pansamantalang busy ang AI: " + (err.message || "Pakisubukang muli."));
      }
    } finally {
      clearTimeout(timer);
      setIsAnalyzingLabel(false);
      e.target.value = "";
    }
  };

  const handleSaveManualMeal = (e) => {
    e.preventDefault();
    const cNum = parseInt(manualCal, 10);
    if (!manualName.trim() || isNaN(cNum) || cNum <= 0) {
      if (showToast) showToast("Pakilagay ang pangalan ng pagkain at wastong calories!");
      return;
    }

    const newMeal = {
      id: Date.now(),
      name: manualName.trim(),
      mealType: activeModalBucket,
      portion: manualPortion.trim() || "1 serving",
      cal: cNum,
      calories: cNum,
      p: Number(manualP) || 0,
      c: Number(manualC) || 0,
      f: Number(manualF) || 0,
      dateLogged: todayISO,
      timestamp: Date.now()
    };

    if (saveToCloud) saveToCloud({ ...appData, meals: [newMeal, ...(appData?.meals || [])] });
    if (showToast) showToast(`🍽️ Logged: ${manualName} (+${cNum} kcal)!`);
    closeModal();
  };

  const getBucketLabel = (type) => {
    switch (type) {
      case "breakfast": return "Breakfast";
      case "lunch": return "Lunch";
      case "dinner": return "Dinner";
      case "snack": return "Snacks";
      default: return "Meal";
    }
  };

  const getBucketIcon = (type) => {
    switch (type) {
      case "breakfast": return { icon: "fa-sun", color: "#f59e0b", bg: "#fef3c7" };
      case "lunch": return { icon: "fa-cloud-sun", color: "#0ea5e9", bg: "#e0f2fe" };
      case "dinner": return { icon: "fa-moon", color: "#6366f1", bg: "#e0e7ff" };
      case "snack": return { icon: "fa-apple-whole", color: "#10b981", bg: "#d1fae5" };
      default: return { icon: "fa-utensils", color: "#64748b", bg: "#f1f5f9" };
    }
  };

  return (
    <div className="screen active" style={{ maxWidth: "420px", margin: "0 auto", padding: "0 10px 40px 10px" }}>
      
      {/* ─── 1. TOP HEADER & MACRO PROGRESS CARD ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", paddingTop: "4px" }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 900, color: "#0f172a", margin: 0 }}>
            Nutrition & Diary
          </h2>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }}>
            Daily Command Center & Meal Buckets
          </span>
        </div>
        <span style={{ fontSize: "10px", fontWeight: 800, color: "#4f46e5", background: "#eef2ff", padding: "3px 8px", borderRadius: "8px" }}>
          Today's Log
        </span>
      </div>

      <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "18px", padding: "14px", marginBottom: "14px", boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", textAlign: "center", gap: "6px", marginBottom: "12px" }}>
          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Eaten</span>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "1px" }}>{totalCal.toLocaleString()}</div>
            <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>kcal</span>
          </div>

          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Target</span>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#4f46e5", marginTop: "1px" }}>{calorieGoal.toLocaleString()}</div>
            <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>kcal</span>
          </div>

          <div style={{ background: "#f8fafc", padding: "8px", borderRadius: "10px", border: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: "9px", fontWeight: 700, color: "#10b981", textTransform: "uppercase" }}>Remaining</span>
            <div style={{ fontSize: "16px", fontWeight: 900, color: "#10b981", marginTop: "1px" }}>{Math.max(0, calorieGoal - totalCal).toLocaleString()}</div>
            <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>kcal</span>
          </div>
        </div>

        {/* Live Macro Progress Bars */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
              <span style={{ color: "#0f172a" }}>Protein</span>
              <span style={{ color: "#6366f1" }}>{Math.round(totalP)}/{targetProtein}g</span>
            </div>
            <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(Math.round((totalP / targetProtein) * 100), 100)}%`, height: "100%", background: "#6366f1", borderRadius: "999px" }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
              <span style={{ color: "#0f172a" }}>Carbs</span>
              <span style={{ color: "#0ea5e9" }}>{Math.round(totalC)}/{targetCarbs}g</span>
            </div>
            <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(Math.round((totalC / targetCarbs) * 100), 100)}%`, height: "100%", background: "#0ea5e9", borderRadius: "999px" }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", fontWeight: 800, marginBottom: "2px" }}>
              <span style={{ color: "#0f172a" }}>Fats</span>
              <span style={{ color: "#f59e0b" }}>{Math.round(totalF)}/{targetFat}g</span>
            </div>
            <div style={{ height: "4px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(Math.round((totalF / targetFat) * 100), 100)}%`, height: "100%", background: "#f59e0b", borderRadius: "999px" }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MEAL CATEGORY BUCKETS ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {["breakfast", "lunch", "dinner", "snack"].map((bucketKey) => {
          const items = mealBuckets[bucketKey] || [];
          const bucketCal = getBucketCalories(items);
          const meta = getBucketIcon(bucketKey);

          return (
            <div
              key={bucketKey}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "12px 14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: items.length > 0 ? "10px" : "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: meta.bg, color: meta.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
                    <i className={`fa-solid ${meta.icon}`}></i>
                  </div>
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a", display: "block", lineHeight: 1.1 }}>
                      {getBucketLabel(bucketKey)}
                    </span>
                    <span style={{ fontSize: "9.5px", fontWeight: 700, color: "#64748b" }}>
                      {bucketCal} kcal
                    </span>
                  </div>
                </div>

                <button type="button"
                  onClick={() => setActiveModalBucket(bucketKey)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    color: "#4f46e5",
                    padding: "5px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <i className="fa-solid fa-plus" style={{ fontSize: "9px" }}></i>
                  <span>Add Food</span>
                </button>
              </div>

              {items.length === 0 ? (
                <div style={{ padding: "6px 0 2px 0", fontSize: "10.5px", color: "#94a3b8", fontStyle: "italic" }}>
                  No food logged for {getBucketLabel(bucketKey).toLowerCase()} yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {items.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #f1f5f9",
                        borderRadius: "10px",
                        padding: "8px 10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#0f172a" }}>{m.name}</span>
                          <span style={{ fontSize: "10px", fontWeight: 600, color: "#6366f1" }}>({m.portion || "1 serving"})</span>
                        </div>
                        <span style={{ fontSize: "10px", color: "#64748b", fontWeight: 700, display: "block", marginTop: "1px" }}>
                          {m.cal} kcal • P:{m.p || 0}g • C:{m.c || 0}g • F:{m.f || 0}g
                        </span>
                      </div>

                      <button type="button"
                        onClick={() => deleteMeal(m.id)}
                        style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "12px", cursor: "pointer", padding: "4px" }}
                        title="Delete entry"
                      >
                        <i className="fa-solid fa-trash" style={{ color: "#ef4444" }}></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ─── 3. FULL SLIDE-OVER COMMAND PANEL ─── */}
      {activeModalBucket && (
        <div
          style={{
            position: "fixed",
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
            margin: "0 auto",
            maxWidth: "480px",
            width: "100%",
            background: "#f8fafc",
            zIndex: 1050,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 0 35px rgba(0,0,0,0.18)",
            animation: "slideInRight 0.22s ease-out"
          }}
        >
          {/* STICKY TOP HEADER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid #e2e8f0",
              background: "#ffffff",
              position: "sticky",
              top: 0,
              zIndex: 10
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: "16px", fontWeight: 900, margin: 0, color: "#0f172a", letterSpacing: "-0.3px" }}>
                  Add to {getBucketLabel(activeModalBucket)}
                </h3>
                <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                  Scan barcode, AI label, or manual log
                </span>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "14px",
                  flexShrink: 0,
                  transition: "all 0.15s ease"
                }}
                title="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>

            
          </div>

          {/* SCROLLABLE PANEL BODY */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              paddingBottom: "110px",
              WebkitOverflowScrolling: "touch"
            }}
          >
            {/* ─── PRIMARY SECTION: MANUAL FORM + BARCODE BUTTON + PORTION SCALER ─── */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                padding: "14px",
                marginBottom: "16px",
                boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
    <i className="fa-solid fa-pen-to-square" style={{ color: "#4f46e5", fontSize: "12px" }}></i>
    <span style={{ fontSize: "12px", fontWeight: 900, color: "#0f172a", whiteSpace: "nowrap" }}>Manual Entry</span>
  </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {/* 📷 BARCODE SCANNER BUTTON */}
                    <button
                      type="button"
                      onClick={() => setIsBarcodeScannerOpen(true)}
                      style={{
                        background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
                        color: "white",
                        border: "none",
                        padding: "5px 9px",
                        borderRadius: "8px",
                        fontSize: "10.5px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        boxShadow: "0 2px 5px rgba(14, 165, 233, 0.25)"
                      }}
                      title="Scan Barcode"
                    >
                      <i className="fa-solid fa-barcode"></i>
                      <span>Barcode</span>
                    </button>

                    {/* 🏷️ AI NUTRITION LABEL SCANNER BUTTON */}
                    <button
                      type="button"
                      disabled={isAnalyzingLabel}
                      onClick={() => {
                        const fileInput = document.getElementById("ai-label-input");
                        if (fileInput) fileInput.click();
                      }}
                      style={{
                        background: isAnalyzingLabel ? "#94a3b8" : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        color: "white",
                        border: "none",
                        height: "28px",
                        padding: "0 9px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: isAnalyzingLabel ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        boxShadow: "0 2px 5px rgba(99, 102, 241, 0.25)"
                      }}
                      title="Take photo of Nutrition Facts label"
                    >
                      <i className={isAnalyzingLabel ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-camera"}></i>
                      <span>{isAnalyzingLabel ? "Reading..." : "AI Label"}</span>
                    </button>
                    <input 
                      id="ai-label-input" 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      style={{ display: "none" }} 
                      onChange={handleNutritionLabelUpload}
                    />
                  </div>
              </div>

              <form onSubmit={handleSaveManualMeal}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Food / Dish Name*
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sinigang na Baboy"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "#f8fafc",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>
                      Portion Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1 bowl / 150g"
                      value={manualPortion}
                      onChange={(e) => setManualPortion(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "12px",
                        fontWeight: 700,
                        background: "#f8fafc",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                {/* ⚖️ DYNAMIC PORTION MULTIPLIER BUTTONS */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                      Portion Multiplier:
                    </span>
                    <span style={{ fontSize: "9.5px", color: "#6366f1", fontWeight: 800 }}>
                      Current: {multiplier}x
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {[0.5, 1, 1.5, 2].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSelectMultiplier(num)}
                        style={{
                          flex: 1,
                          padding: "6px 0",
                          borderRadius: "8px",
                          border: multiplier === num ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                          background: multiplier === num ? "#eef2ff" : "#ffffff",
                          color: multiplier === num ? "#4f46e5" : "#475569",
                          fontSize: "11px",
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                      >
                        {num}x
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: "10px" }}>
                  <label style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", display: "block", marginBottom: "3px" }}>
                    Calories (kcal)*
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    required
                    value={manualCal}
                    onChange={(e) => setManualCal(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: 800,
                      background: "#f8fafc",
                      outline: "none"
                    }}
                  />
                </div>

                {/* 3-Column Macros Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "9.5px", fontWeight: 700, color: "#6366f1", display: "block", marginBottom: "2px" }}>
                      Protein (g)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={manualP}
                      onChange={(e) => setManualP(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        background: "#f8fafc",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "9.5px", fontWeight: 700, color: "#0ea5e9", display: "block", marginBottom: "2px" }}>
                      Carbs (g)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={manualC}
                      onChange={(e) => setManualC(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        background: "#f8fafc",
                        outline: "none"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "9.5px", fontWeight: 700, color: "#f59e0b", display: "block", marginBottom: "2px" }}>
                      Fats (g)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={manualF}
                      onChange={(e) => setManualF(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 8px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        background: "#f8fafc",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                    color: "white",
                    border: "none",
                    padding: "11px",
                    borderRadius: "10px",
                    fontSize: "12px",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)"
                  }}
                >
                  <i className="fa-solid fa-circle-check"></i>
                  <span>Log to {getBucketLabel(activeModalBucket)}</span>
                </button>
              </form>
            </div>

            {/* ─── SECONDARY SECTION: VERIFIED SUGGESTIONS & AUTO-FILL LIBRARY ─── */}
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: 900, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  ⚡ Quick Suggestions (Auto-fill)
                </span>
                <span style={{ fontSize: "9.5px", color: "#94a3b8", fontWeight: 700 }}>
                  Tap to select
                </span>
              </div>

              {/* Search Bar for Suggestions */}
              <div style={{ position: "relative", marginBottom: "10px" }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: "absolute", left: "12px", top: "11px", color: "#94a3b8", fontSize: "12px" }}></i>
                <input
                  type="text"
                  placeholder="Filter staples (e.g. Rice, Egg, Chicken, Adobo)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px 9px 34px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: 700,
                    outline: "none",
                    background: "#ffffff"
                  }}
                />
                {searchQuery && (
                  <button type="button"
                    onClick={() => setSearchQuery("")}
                    style={{ position: "absolute", right: "10px", top: "9px", background: "none", border: "none", color: "#94a3b8", fontSize: "12px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Suggestions Cards List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {filteredFoods.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "16px 10px", color: "#94a3b8", fontSize: "11px" }}>
                    Walang tumugmang staple para sa "{searchQuery}". Gamitin ang manual form sa itaas!
                  </div>
                ) : (
                  filteredFoods.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: "#1e293b",
                        borderRadius: "12px",
                        padding: "10px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        color: "#ffffff"
                      }}
                    >
                      <div
                        onClick={() => handleAutoFillFromSuggestion(item)}
                        style={{ flex: 1, cursor: "pointer" }}
                        title="Click to auto-fill form above"
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: "#f8fafc" }}>{item.name}</span>
                          <i className="fa-solid fa-circle-check" style={{ color: "#10b981", fontSize: "10.5px" }}></i>
                          {item.isUserCustom && (
                            <span style={{ fontSize: "8px", fontWeight: 900, background: "#334155", color: "#93c5fd", padding: "1px 4px", borderRadius: "4px" }}>
                              PRESET
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "10.5px", color: "#94a3b8", fontWeight: 600, display: "block", marginTop: "2px" }}>
                          {item.cal} cal • {item.serving} (P:{item.p || 0}g C:{item.c || 0}g F:{item.f || 0}g)
                        </span>
                      </div>

                      <button type="button"
                        onClick={() => handleQuickLogSuggestion(item)}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          background: "#334155",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#38bdf8",
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "8px"
                        }}
                        title={`1-Tap Quick Log ${item.name}`}
                      >
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ─── 4. CAMERA BARCODE SCANNER OVERLAY MODAL ─── */}
      {isBarcodeScannerOpen && (
        <div
          onClick={() => setIsBarcodeScannerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "380px",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "18px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <i className="fa-solid fa-camera" style={{ color: "#0ea5e9", fontSize: "14px" }}></i>
                <h4 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  Barcode Scanner
                </h4>
              </div>
              <button type="button"
                onClick={() => setIsBarcodeScannerOpen(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "16px", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "11px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
              Itapat ang camera sa barcode ng packaging ng pagkain para awtomatikong makuha ang nutrition facts.
            </p>

            {/* LIVE CAMERA VIEW CONTAINER */}
            <div
              id="interactive-camera-barcode-region"
              style={{
                width: "100%",
                minHeight: "200px",
                borderRadius: "12px",
                overflow: "hidden",
                background: "#0f172a",
                position: "relative"
              }}
            ></div>

            {/* DIRECT MANUAL BARCODE NUMBER INPUT */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", display: "block", marginBottom: "4px" }}>
                O i-type ang 12 o 13-digit Barcode number:
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="Hal. 4800016644810"
                  value={manualBarcodeCode}
                  onChange={(e) => setManualBarcodeCode(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "12px",
                    fontWeight: 700,
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  disabled={isFetchingBarcode}
                  onClick={() => lookupBarcodeOnline(manualBarcodeCode)}
                  style={{
                    background: "#0284c7",
                    color: "white",
                    border: "none",
                    padding: "0 12px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  {isFetchingBarcode ? "..." : "Search"}
                </button>
              </div>
            </div>

            <button type="button"
              onClick={() => setIsBarcodeScannerOpen(false)}
              style={{
                width: "100%",
                background: "#f1f5f9",
                border: "none",
                color: "#475569",
                padding: "8px",
                borderRadius: "8px",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
