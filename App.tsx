import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { Button } from './components/Button';
import { TryOnState } from './types';
import { processFile } from './utils';
import { generateTryOn } from './services/geminiService';

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [state, setState] = useState<TryOnState>({
    humanImage: null,
    sareeImage: null,
    generatedImage: null,
    isGenerating: false,
    error: null,
  });

  // Check for API Key on mount
  useEffect(() => {
    const checkKey = async () => {
      // Support for shared/deployed apps:
      // If the API key is injected at build time or via environment variables, 
      // we consider the app "connected" automatically.
      if (process.env.API_KEY) {
        setApiKeySelected(true);
        return;
      }

      // Otherwise, check for dynamic selection via AI Studio extension
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      } else {
        setApiKeySelected(false);
      }
    };
    checkKey();
  }, []);

  const handleConnect = async () => {
    if (window.aistudio?.openSelectKey) {
      try {
        await window.aistudio.openSelectKey();
        // Assume success if no error thrown, as per race condition mitigation instruction
        setApiKeySelected(true);
      } catch (e) {
        console.error("Failed to select key", e);
        setState(s => ({ ...s, error: "Failed to connect to Google Cloud. Please try again." }));
      }
    } else {
      setState(s => ({ ...s, error: "AI Studio environment not detected. If you are running this locally, please set the API_KEY environment variable." }));
    }
  };

  const handleImageSelect = async (type: 'human' | 'saree', file: File) => {
    try {
      const processed = await processFile(file);
      setState(prev => ({
        ...prev,
        [type === 'human' ? 'humanImage' : 'sareeImage']: processed,
        error: null // clear errors on new upload
      }));
    } catch (e) {
      setState(prev => ({ ...prev, error: "Failed to process image file." }));
    }
  };

  const handleGenerate = async () => {
    if (!state.humanImage || !state.sareeImage) return;
    
    // Safety check for API key
    // We check both the process.env and the state flag
    if (!process.env.API_KEY && !apiKeySelected) {
        await handleConnect();
        return; 
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null, generatedImage: null }));

    try {
      const resultImage = await generateTryOn(state.humanImage, state.sareeImage);
      setState(prev => ({ ...prev, generatedImage: resultImage, isGenerating: false }));
    } catch (error: any) {
        // If error suggests auth issue, reset key state (unless it's hardcoded in env)
        if ((error.message?.includes("Requested entity was not found") || error.message?.includes("API Key")) && !process.env.API_KEY) {
            setApiKeySelected(false);
            await handleConnect(); // Prompt again
        }
        setState(prev => ({ ...prev, isGenerating: false, error: error.message }));
    }
  };

  const handleReset = () => {
    setState({
        humanImage: null,
        sareeImage: null,
        generatedImage: null,
        isGenerating: false,
        error: null
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-6 md:px-12 bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-serif font-bold text-stone-900">Saree<span className="text-rose-600">.AI</span></span>
            <span className="hidden md:inline-block px-2 py-1 bg-stone-100 text-stone-500 text-xs tracking-widest uppercase rounded ml-2">Beta</span>
          </div>
          
          <div className="flex items-center gap-4">
             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-stone-500 hover:text-rose-600 transition-colors hidden sm:block">
                Pricing & Billing
             </a>
             {!apiKeySelected && (
                 <Button variant="secondary" onClick={handleConnect} className="text-xs px-4 py-2">
                    Connect Google Cloud
                 </Button>
             )}
             {apiKeySelected && (
                 <div className="flex items-center text-green-600 text-xs font-medium bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Gemini Pro Connected
                 </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-6 md:p-12">
        
        {/* Intro */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 mb-4 leading-tight">
            Virtual Saree Try-On
          </h1>
          <p className="text-stone-600 text-lg">
            Experience the elegance of any saree on you. Upload your photo and a saree image to see a photorealistic try-on powered by Gemini 3.
          </p>
        </div>

        {/* Error Message */}
        {state.error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center max-w-2xl mx-auto animate-fade-in">
                {state.error}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Input Section */}
            <div className="lg:col-span-5 space-y-8">
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100">
                    <h2 className="text-xl font-serif font-semibold text-stone-800 mb-6 flex items-center">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-stone-900 text-white text-sm mr-3">1</span>
                        Upload Images
                    </h2>
                    
                    <div className="space-y-6">
                        <ImageUploader 
                            label="Your Photo" 
                            image={state.humanImage}
                            onImageSelected={(f) => handleImageSelect('human', f)}
                            onClear={() => setState(s => ({ ...s, humanImage: null }))}
                            placeholderText="Full body shot works best"
                            icon={(
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        />
                        
                        <div className="flex items-center justify-center">
                            <div className="h-8 w-[1px] bg-stone-200"></div>
                        </div>

                        <ImageUploader 
                            label="Saree Image" 
                            image={state.sareeImage}
                            onImageSelected={(f) => handleImageSelect('saree', f)}
                            onClear={() => setState(s => ({ ...s, sareeImage: null }))}
                            placeholderText="Image of the saree (flat or worn)"
                            icon={(
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )}
                        />
                    </div>

                    <div className="mt-8 pt-6 border-t border-stone-100">
                         <Button 
                            className="w-full py-4 text-lg" 
                            disabled={!state.humanImage || !state.sareeImage}
                            onClick={handleGenerate}
                            isLoading={state.isGenerating}
                         >
                            {state.isGenerating ? 'Designing Look...' : 'Generate Try-On'}
                         </Button>
                         {!apiKeySelected && (
                             <p className="text-center text-xs text-stone-400 mt-2">Requires valid API Key selection</p>
                         )}
                    </div>
                </div>
            </div>

            {/* Result Section */}
            <div className="lg:col-span-7">
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100 min-h-[600px] flex flex-col">
                    <h2 className="text-xl font-serif font-semibold text-stone-800 mb-6 flex items-center">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-600 text-white text-sm mr-3">2</span>
                        Your Look
                    </h2>

                    <div className="flex-grow flex items-center justify-center bg-stone-50 rounded-xl overflow-hidden border border-stone-100 relative">
                        {state.isGenerating ? (
                            <div className="text-center p-8">
                                <div className="inline-block w-16 h-16 border-4 border-stone-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
                                <h3 className="text-lg font-medium text-stone-800 animate-pulse">Weaving the magic...</h3>
                                <p className="text-stone-500 mt-2 max-w-xs mx-auto">Gemini Pro is analyzing the fabric drape and lighting. This may take a few seconds.</p>
                            </div>
                        ) : state.generatedImage ? (
                            <div className="relative w-full h-full group">
                                <img 
                                    src={state.generatedImage} 
                                    alt="Generated Try-On" 
                                    className="w-full h-full object-contain max-h-[800px]"
                                />
                                <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <a 
                                        href={state.generatedImage} 
                                        download="saree-try-on.png"
                                        className="bg-white text-stone-800 px-4 py-2 rounded-lg shadow-lg hover:bg-stone-50 text-sm font-medium flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </a>
                                    <button 
                                        onClick={handleReset}
                                        className="bg-stone-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-stone-800 text-sm font-medium"
                                    >
                                        New Try-On
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center p-12 opacity-40">
                                <svg className="w-24 h-24 mx-auto text-stone-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <p className="text-lg font-serif text-stone-500">Result will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Tips */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                        <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="font-bold text-stone-800 text-sm mb-1">Lighting Matters</h3>
                        <p className="text-xs text-stone-500">Ensure both photos have good, natural lighting for the most realistic blend.</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                         <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <h3 className="font-bold text-stone-800 text-sm mb-1">Clear View</h3>
                        <p className="text-xs text-stone-500">Use a full-body photo where the person is clearly visible without obstructions.</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                         <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center mb-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="font-bold text-stone-800 text-sm mb-1">High Quality</h3>
                        <p className="text-xs text-stone-500">Higher resolution uploads lead to better texture preservation in the saree.</p>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;