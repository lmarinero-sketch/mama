import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Download, 
  Scale, 
  FileText, 
  Wallet, 
  MapPin, 
  Package, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  MessageCircle,
  Lightbulb
} from 'lucide-react';
import { MANUAL_SECTIONS, MANUAL_CATEGORIES, ManualSection } from '../lib/manualContent';
import { AdminBottomNav } from '../components/admin/AdminBottomNav';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Mapeo de íconos
const ICON_MAP: Record<string, React.ElementType> = {
  Scale,
  FileText,
  Wallet,
  MapPin,
  Package,
  HelpCircle
};

export const AdminManualPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'pedidos-decimales': true,
    'cta-cte-cobranzas': true
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSections = MANUAL_SECTIONS.filter(sec => {
    if (selectedCategory !== 'todos' && sec.category !== selectedCategory) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchSumm = sec.summary.toLowerCase().includes(q);
      const matchSteps = sec.steps.some(s => s.toLowerCase().includes(q));
      return matchTitle || matchSumm || matchSteps;
    }
    return true;
  });

  // Generación del Manual Operativo en PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Encabezado
    doc.setFillColor(94, 123, 96); // #5E7B60
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('FIAMBRERÍA Y DELICATESSEN MAMÁ', 15, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('MANUAL OPERATIVO DE PROCEDIMIENTOS & GUÍA DE SISTEMA', 15, 23);
    doc.text(`San Juan, Argentina • Generado el ${new Date().toLocaleDateString('es-AR')}`, 15, 29);

    let yPos = 45;

    MANUAL_SECTIONS.forEach((sec, idx) => {
      // Verificar salto de página
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      // Título de Sección
      doc.setFillColor(235, 242, 220); // softYellow
      doc.roundedRect(15, yPos, 180, 8, 2, 2, 'F');

      doc.setTextColor(36, 54, 39); // brand-dark
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${idx + 1}. ${sec.title.toUpperCase()}`, 18, yPos + 5.5);

      yPos += 13;

      // Resumen
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const summLines = doc.splitTextToSize(sec.summary, 175);
      doc.text(summLines, 18, yPos);
      yPos += summLines.length * 4.5 + 3;

      // Pasos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(40, 40, 40);

      sec.steps.forEach((step, sIdx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const stepLines = doc.splitTextToSize(`${sIdx + 1}. ${step}`, 170);
        doc.text(stepLines, 22, yPos);
        yPos += stepLines.length * 4 + 1.5;
      });

      // Tips si existen
      if (sec.tips && sec.tips.length > 0) {
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(94, 123, 96);
        doc.text('Consejos prácticos:', 22, yPos);
        yPos += 4;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        sec.tips.forEach(t => {
          const tLines = doc.splitTextToSize(`• ${t}`, 168);
          doc.text(tLines, 24, yPos);
          yPos += tLines.length * 3.5 + 1;
        });
      }

      yPos += 6;
    });

    // Pie de página final
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      doc.text(`Fiambrería Mamá • Manual de Operaciones • Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
    }

    doc.save('Manual_Operativo_Fiambreria_Mama.pdf');
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark pb-28 max-w-lg mx-auto relative border-x border-brand-secondary/40">
      {/* Header Fijo */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-brand-secondary/80 p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-brown text-white flex items-center justify-center font-bold shadow-soft">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-brand-dark leading-tight">
                Manuales & Ayuda
              </h2>
              <p className="text-[11px] text-brand-dark/70 font-medium">
                Guías de procedimiento y consulta operativa
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="py-1.5 px-2.5 rounded-xl bg-brand-brown hover:bg-brand-brown/90 text-white font-bold text-xs shadow-soft flex items-center gap-1 active:scale-95 transition-all"
            title="Descargar Manual en PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>

        {/* Buscador de Manuales */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-brand-dark/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar procedimiento (ej: balanza, cobro, remito)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-brand-secondary rounded-xl pl-8 pr-3 py-2 text-xs text-brand-dark placeholder:text-brand-dark/40 focus:outline-none focus:border-brand-brown focus:ring-2 focus:ring-brand-brown/20 shadow-xs"
          />
        </div>

        {/* Filtro por Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-xs font-bold pb-0.5">
          {MANUAL_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-xl whitespace-nowrap shrink-0 transition-all text-xs ${
                selectedCategory === cat.id
                  ? 'bg-brand-brown text-white shadow-soft font-black'
                  : 'bg-white text-brand-dark/70 border border-brand-secondary/80 hover:bg-brand-softYellow/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <main className="p-4 space-y-3.5">
        {/* Banner Asistente Lucas */}
        <div className="bg-brand-softYellow/80 border border-brand-yellow rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white border border-brand-yellow flex items-center justify-center text-lg shrink-0 shadow-2xs">
              👨‍💼
            </div>
            <div>
              <h4 className="text-xs font-black text-brand-dark leading-tight">
                ¿Tenés dudas sobre algún procedimiento?
              </h4>
              <p className="text-[10px] text-brand-dark/70 font-medium">
                Preguntale directamente a **Lucas** con lenguaje natural desde el botón flotante.
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Secciones del Manual */}
        <div className="space-y-3">
          {filteredSections.length === 0 ? (
            <div className="p-8 text-center bg-white border border-brand-secondary/80 rounded-2xl space-y-2 shadow-soft">
              <BookOpen className="w-8 h-8 text-brand-brown/50 mx-auto" />
              <h4 className="font-extrabold text-sm text-brand-dark">No se encontraron manuales</h4>
              <p className="text-xs text-brand-dark/60">
                Probá con otra palabra de búsqueda o cambiá la categoría seleccionada.
              </p>
            </div>
          ) : (
            filteredSections.map(sec => {
              const Icon = ICON_MAP[sec.iconName] || BookOpen;
              const isExpanded = !!expandedSections[sec.id];

              return (
                <div
                  key={sec.id}
                  className="bg-white rounded-2xl border border-brand-secondary/80 shadow-soft overflow-hidden transition-all"
                >
                  {/* Header de la Sección */}
                  <button
                    onClick={() => toggleSection(sec.id)}
                    className="w-full text-left p-3.5 flex items-start justify-between gap-3 hover:bg-brand-cream/30 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-brand-softYellow text-brand-brown flex items-center justify-center shrink-0 mt-0.5 border border-brand-yellow">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-black text-brand-dark leading-tight">
                          {sec.title}
                        </h3>
                        <p className="text-[11px] text-brand-dark/70 font-medium mt-0.5 line-clamp-2">
                          {sec.summary}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 p-1 text-brand-dark/50">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Detalle Desplegable */}
                  {isExpanded && (
                    <div className="px-3.5 pb-4 pt-1 border-t border-brand-secondary/40 space-y-3 bg-brand-bg/30 animate-in fade-in duration-200">
                      {/* Pasos Numerados */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-black text-brand-brown uppercase tracking-wider block">
                          Paso a paso:
                        </span>
                        {sec.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-xs text-brand-dark leading-relaxed">
                            <span className="w-4 h-4 rounded-full bg-brand-cream text-brand-brown border border-brand-secondary text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <span className="font-medium">{step}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tips / Consejos Prácticos */}
                      {sec.tips && sec.tips.length > 0 && (
                        <div className="bg-brand-cream/70 border border-brand-secondary/60 rounded-xl p-2.5 text-xs space-y-1">
                          <span className="font-black text-brand-dark flex items-center gap-1 text-[11px]">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Consejos Prácticos de Reparto:</span>
                          </span>
                          {sec.tips.map((tip, tIdx) => (
                            <p key={tIdx} className="text-brand-dark/80 text-[11px] font-medium pl-4 relative">
                              <span className="absolute left-1 top-0">•</span>
                              {tip}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Indicadores / KPIs */}
                      {sec.kpis && sec.kpis.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {sec.kpis.map((kpi, kIdx) => (
                            <span key={kIdx} className="text-[9px] font-bold bg-white text-brand-dark/70 px-2 py-0.5 rounded-md border border-brand-secondary/60">
                              📊 {kpi}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
};
