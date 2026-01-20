import React, { useState, useRef } from 'react';
import { Upload, X, GripVertical, FileText, Download, Loader2, Trash2, FilePlus } from 'lucide-react';

export default function PDFMerger() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const pdfFileList = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfFileList.length === 0) {
      alert('Please select valid PDF files only');
      return;
    }
    
    const newFiles = pdfFileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file: file,
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    }));
    
    setPdfFiles(prev => [...prev, ...newFiles]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
  };

  const removeFile = (id) => {
    setPdfFiles(prev => prev.filter(file => file.id !== id));
  };

  const clearAll = () => {
    setPdfFiles([]);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverItem = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFiles = [...pdfFiles];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(index, 0, draggedFile);
    
    setPdfFiles(newFiles);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const mergePDFs = async () => {
    if (pdfFiles.length < 2) {
      alert('Please add at least 2 PDF files to merge');
      return;
    }

    setIsProcessing(true);

    try {
      const { PDFDocument } = await import('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm');
      
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'merged-document.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsProcessing(false);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      alert('An error occurred while merging PDFs. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container">
      <main role="main" className="card" aria-labelledby="app-title">
        <header role="banner" className="header">
          <div className="brand-mark" aria-hidden="true">
            <FileText style={{width:28,height:28,color:'white'}} />
          </div>
          <h1 id="app-title" className="title">PDF Merger</h1>
          <p className="subtitle">Combine multiple PDF files into one seamless document — drag, reorder, and merge efficiently.</p>
        </header>

        <section id="upload-zone" role="region" aria-labelledby="upload-zone-title" className={`upload-zone ${isDragging ? 'dragging' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <div className="upload-illustration" aria-hidden="true">
            <Upload style={{width:34,height:34,color:'white'}} />
          </div>
          <h3 id="upload-zone-title" className="upload-title">Drop your PDF files here</h3>
          <p className="upload-desc">or click below to browse</p>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn--secondary" aria-label="Browse files to upload">
              <FilePlus style={{width:16,height:16}} />
              Browse files
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf" multiple onChange={handleFileInput} style={{display:'none'}} aria-hidden="true" />
          </div>
        </section>

        {pdfFiles.length > 0 && (
          <div className="files-card" role="region" aria-label="Files to merge">
            <div className="files-header">
              <div className="files-title">
                <div className="counter-badge">{pdfFiles.length}</div>
                <div>Files ready to merge</div>
              </div>
              <button type="button" onClick={clearAll} disabled={isProcessing} className="clear-btn" aria-label="Clear all files">
                <Trash2 style={{width:16,height:16}} />
                Clear all
              </button>
            </div>

            <div className="file-list" role="list">
              {pdfFiles.map((file, index) => {
                const colorClasses = ['pdf-red','pdf-blue','pdf-green','pdf-yellow'];
                const colorClass = colorClasses[index % colorClasses.length];
                return (
                  <div key={file.id} role="listitem" draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOverItem(e, index)} onDragEnd={handleDragEnd} className={`file-item ${draggedIndex === index ? 'dragging' : ''}`}>
                    <div className="file-handle" aria-hidden="true"><GripVertical style={{width:18,height:18}} /></div>
                    <div className={`pdf-icon ${colorClass}`} aria-hidden="true"><FileText style={{width:22,height:22}} /></div>
                    <div className="meta">
                      <div className="filename" title={file.name}>{file.name}</div>
                      <div className="filesub">
                        <div className="muted">{file.size}</div>
                        <div className="position-badge" aria-hidden="true">{index + 1}</div>
                      </div>
                    </div>

                    <button type="button" onClick={() => removeFile(file.id)} className="remove-btn" aria-label={`Remove ${file.name}`}>
                      <X style={{width:18,height:18}} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="tip" role="note"><GripVertical style={{width:16,height:16}} /><div><strong>Tip:</strong> Drag files to reorder before merging</div></div>
          </div>
        )}

        {pdfFiles.length > 0 && (
          <div className="merge-card">
            <button type="button" onClick={mergePDFs} disabled={isProcessing || pdfFiles.length < 2} className="merge-btn" aria-label="Merge and download PDF">
              {isProcessing ? (
                <><span className="spinner" aria-hidden="true" /> Merging your PDFs...</>
              ) : (
                <><Download style={{width:18,height:18,marginRight:8}} aria-hidden="true"/> Merge & download</>
              )}
            </button>
            <div style={{minWidth:180,textAlign:'right'}}>
              {pdfFiles.length < 2 ? <div className="info-text">Add at least 2 files</div> : <div className="info-text">{pdfFiles.length} files selected</div>}
            </div>
          </div>
        )}

        {pdfFiles.length === 0 && (
          <div className="empty-state" role="region" aria-live="polite">
            <div style={{maxWidth:420,margin:'0 auto'}}>
              <div style={{width:64,height:64,margin:'0 auto 12px',borderRadius:12,background:'var(--gray-10, #f3f4f6)',display:'flex',alignItems:'center',justifyContent:'center'}} aria-hidden="true"><FilePlus style={{width:28,height:28,color:'#9ca3af'}}/></div>
              <h3 style={{fontSize:18,fontWeight:700,color:'var(--gray-90)',marginBottom:6}}>No files added yet</h3>
              <p className="muted">Upload your PDF files to get started with merging</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
