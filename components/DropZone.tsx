'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { mockMeblironData } from '@/tests/fixtures/mebliron';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { AuditReportData, AuditInputData } from '@/lib/audit/types';
import { parseDirectExcel } from '@/lib/parser/excel-parser';

interface DropZoneProps {
  onAuditComplete: (report: AuditReportData, sourceName: string) => void;
}

export function DropZone({ onAuditComplete }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const parsedData: AuditInputData = parseDirectExcel(buffer);
      const report = await defaultAuditEngine.runAudit(parsedData);
      onAuditComplete(report, file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка при анализе файла';
      setError(`${msg}. Проверьте, что в отчете Яндекс.Директа есть столбцы «Кампания» и «Расход».`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const report = await defaultAuditEngine.runAudit(mockMeblironData);
      onAuditComplete(report, 'mebliron_feb_jul_2026.xlsx (Эталонный кейс)');
    } catch {
      setError('Не удалось загрузить демонстрационные данные.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'csv' && ext !== 'xls') {
        setError('Пожалуйста, загрузите файл выгрузки Яндекс.Директ в формате .xlsx или .csv');
        return;
      }
      await processFile(file);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        id="dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 bg-white shadow-sm ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv,.xls"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
            {isLoading ? (
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            {isLoading ? 'Анализируем выгрузку Директа...' : 'Перетащите сюда отчет из Яндекс.Директа'}
          </h3>

          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            Поддерживаются файлы <span className="font-semibold text-slate-700">.xlsx</span> и{' '}
            <span className="font-semibold text-slate-700">.csv</span> (Мастер отчетов или Статистика по кампаниям)
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              id="choose-file-btn"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Выбрать файл на устройстве</span>
            </button>

            <button
              type="button"
              id="demo-load-btn"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm transition-colors border border-slate-200"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadDemo();
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Загрузить кейс «Меблирон» (15 тыс. ₽)</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 px-2 gap-2">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>Файл анализируется мгновенно и не передается третьим лицам</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>Бесплатный расчет сливов за 2 секунды</span>
        </div>
      </div>
    </div>
  );
}
