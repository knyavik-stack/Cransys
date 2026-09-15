'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, AlertCircle, CheckCircle2, Shield, BrainCircuit } from 'lucide-react';
import { mockMeblironData } from '@/tests/fixtures/mebliron';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { AuditReportData, AuditInputData } from '@/lib/audit/types';
import { parseDirectExcel } from '@/lib/parser/excel-parser';
import { useUser } from '@/lib/auth/user-context';

interface DropZoneProps {
  onAuditComplete: (report: AuditReportData, sourceName: string) => void;
}

export function DropZone({ onAuditComplete }: DropZoneProps) {
  const { user, incrementReportsUsed } = useUser();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setStatusText('Распознаем структуру отчета (XLSX/CSV)...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Сначала пробуем серверный роут (с сохранением в Neon DB и Gemini AI)
      setStatusText('Выполняем расчет сливов и запускаем AI-анализ...');
      const headers: Record<string, string> = {};
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-email'] = user.email;
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          incrementReportsUsed();
          onAuditComplete(data.report, file.name);
          return;
        }
      }

      // Fallback на клиентский парсинг, если API вернул ошибку
      setStatusText('Локальный анализ выгрузки...');
      const buffer = await file.arrayBuffer();
      const parsedData: AuditInputData = parseDirectExcel(buffer);
      const report = await defaultAuditEngine.runAudit(parsedData);
      report.campaigns = parsedData.campaigns;
      incrementReportsUsed();
      onAuditComplete(report, file.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось обработать файл';
      setError(
        `${msg}. Совет: выгрузите из Директа стандартный «Мастер отчетов» или «Статистику по кампаниям» с полями «Кампания», «Расход», «Клики», «Показы».`
      );
    } finally {
      setIsLoading(false);
      setStatusText('');
    }
  };

  const handleLoadDemo = async () => {
    setIsLoading(true);
    setError(null);
    setStatusText('Загружаем эталонный кейс «Меблирон»...');

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockMeblironData),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          incrementReportsUsed();
          onAuditComplete(data.report, 'sample_campaign_2026.xlsx (Пример рекламного кабинета)');
          return;
        }
      }

      // Fallback
      const report = await defaultAuditEngine.runAudit(mockMeblironData);
      report.campaigns = mockMeblironData.campaigns;
      incrementReportsUsed();
      onAuditComplete(report, 'sample_campaign_2026.xlsx (Пример рекламного кабинета)');
    } catch {
      const report = await defaultAuditEngine.runAudit(mockMeblironData);
      report.campaigns = mockMeblironData.campaigns;
      incrementReportsUsed();
      onAuditComplete(report, 'sample_campaign_2026.xlsx (Пример рекламного кабинета)');
    } finally {
      setIsLoading(false);
      setStatusText('');
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
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-10 text-center transition-all duration-200 bg-white shadow-xs ${
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-3 sm:mb-4">
            {isLoading ? (
              <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8" />
            )}
          </div>

          <h3 className="text-base sm:text-xl font-bold text-slate-900 mb-2">
            {isLoading ? statusText || 'Анализируем выгрузку Директа...' : 'Перетащите сюда отчет из Яндекс.Директа'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-5 leading-relaxed">
            Поддерживаются любые форматы: <span className="font-semibold text-slate-700">.xlsx</span>,{' '}
            <span className="font-semibold text-slate-700">.csv</span> и{' '}
            <span className="font-semibold text-slate-700">.xls</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="choose-file-btn"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-xs"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Выбрать файл на устройстве</span>
            </button>

            <button
              type="button"
              id="demo-load-btn"
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs sm:text-sm transition-colors border border-slate-200"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadDemo();
              }}
            >
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Загрузить пример выгрузки (15 тыс. ₽)</span>
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
          <BrainCircuit className="w-4 h-4 text-purple-600" />
          <span>AI-интеллект Gemini + 6 математических правил аудита</span>
        </div>
      </div>
    </div>
  );
}
