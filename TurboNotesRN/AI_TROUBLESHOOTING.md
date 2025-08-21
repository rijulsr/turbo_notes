# 🤖 AI Model Troubleshooting Guide

## Common Issues and Solutions

### 1. Download Failed (HTTP 401/403)

**Problem**: Getting "Download failed with status 401" or "Access denied" errors.

**Solutions**:
- ✅ **Updated URLs**: The new `ImprovedAIService` uses working URLs from bartowski's GGUF repositories
- ✅ **Proper Headers**: Added correct User-Agent and Accept headers
- ✅ **No Authentication Required**: Using public model repositories

**Working Model URLs**:
```
SmolVLM2-500M: https://huggingface.co/bartowski/SmolVLM2-500M-Instruct-GGUF/resolve/main/SmolVLM2-500M-Instruct-Q4_K_M.gguf
Gemma 2.2B: https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf
Phi-3.5 Mini: https://huggingface.co/bartowski/Phi-3.5-mini-instruct-GGUF/resolve/main/Phi-3.5-mini-instruct-Q4_K_M.gguf
Llama 3.1 8B: https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf
```

### 2. Load Failed - "LlamaContext.initFromFile is not a function"

**Problem**: Using incorrect llama.rn API.

**Solutions**:
- ✅ **Correct API**: Use `LlamaContext.init(config)` instead of `LlamaContext.initFromFile()`
- ✅ **Proper Config**: Pass model path as `model` parameter in config object
- ✅ **Safe Initialization**: Added proper error handling and validation

**Correct Usage**:
```typescript
const context = await LlamaContext.init({
  model: '/path/to/model.gguf',
  n_ctx: 2048,
  n_batch: 512,
  n_threads: -1,
  use_mmap: true
});
```

### 3. Memory Issues

**Problem**: App crashes or runs out of memory when loading large models.

**Solutions**:
- ✅ **Size-based Config**: Different settings for small/medium/large models
- ✅ **Conservative Defaults**: Start with CPU-only, limited context
- ✅ **Memory Optimization**: Use mmap, appropriate batch sizes

**Recommended Settings by Model Size**:
```typescript
Small (<3GB): n_ctx: 2048, n_batch: 512
Medium (3-6GB): n_ctx: 4096, n_batch: 256  
Large (>6GB): n_ctx: 2048, n_batch: 128
```

### 4. File Not Found Errors

**Problem**: Model file exists but can't be loaded.

**Solutions**:
- ✅ **Path Verification**: Check file exists before loading
- ✅ **Proper Paths**: Use consistent file naming and paths
- ✅ **File Integrity**: Verify download completed successfully

### 5. Initialization Errors

**Problem**: llama.rn fails to initialize.

**Solutions**:
- ✅ **Platform Check**: Ensure running on iOS/Android
- ✅ **Proper Import**: Import from 'llama.rn' correctly
- ✅ **Error Handling**: Graceful fallback if initialization fails

## Testing Steps

### Step 1: Use the Test Screen
1. Open the app
2. Tap "🧪 Test AI" button
3. Try downloading Gemma 2.2B (smallest model)
4. Load the model after download
5. Test text generation

### Step 2: Check Logs
Monitor console logs for:
```
🚀 Initializing llama.rn...
✅ llama.rn initialized successfully
📥 Starting download: Gemma 2.2B Instruct
✅ Model downloaded successfully
🔄 Loading model: Gemma 2.2B Instruct
✅ Model loaded successfully
```

### Step 3: Verify File System
Check that models are downloaded to:
```
${RNFS.DocumentDirectoryPath}/models/
```

### Step 4: Test Generation
Try simple prompts first:
```
"Hello, how are you?"
"Summarize: Today was a good day."
```

## Updated Implementation

### New ImprovedAIService Features:
- ✅ Working HuggingFace URLs
- ✅ Proper llama.rn API usage
- ✅ Better error handling
- ✅ Progress tracking
- ✅ Memory optimization
- ✅ File cleanup on errors

### New Test Screen Features:
- ✅ Visual progress indicators
- ✅ Real-time status updates
- ✅ Error message display
- ✅ Model management controls
- ✅ Generation testing

### New Utilities:
- ✅ `llamaSetup.ts` - Safe initialization
- ✅ Recommended configurations
- ✅ Platform compatibility checks
- ✅ Error message localization

## Recommended Testing Order

1. **Start Small**: Try Gemma 2.2B first (1.6GB)
2. **Check Storage**: Ensure 2GB+ free space
3. **Stable Network**: Use WiFi for downloads
4. **Monitor Memory**: Close other apps during loading
5. **Test Gradually**: Simple prompts → Complex tasks

## If Problems Persist

### Debug Steps:
1. Check React Native logs: `npx react-native log-android`
2. Verify llama.rn installation: `npm ls llama.rn`
3. Clear app data and retry
4. Try different model (Phi-3.5 Mini is very reliable)

### Alternative Solutions:
1. Use smaller quantization (Q4_0 instead of Q4_K_M)
2. Reduce context length further
3. Use CPU-only mode (n_gpu_layers: 0)
4. Implement streaming for better UX

## Model Recommendations

### For Testing:
- **SmolVLM2-500M**: 🔥 **BEST CHOICE** - Vision model, only 1.1GB, supports image analysis & OCR
- **Gemma 2.2B**: Fast, small, good for basic text tasks
- **Phi-3.5 Mini**: Best balance of size/performance for text

### For Production:
- **SmolVLM2-500M**: 🔥 **RECOMMENDED** - Vision capabilities + small size
- **Phi-3.5 Mini**: Excellent mobile performance for text-only
- **Gemma 2.2B**: Very fast, good for simple text tasks

### Vision Features:
- **SmolVLM2-500M**: Image analysis, OCR, visual note creation, image description
- Other models: Text-only capabilities

### Avoid for Mobile:
- **Llama 3.1 8B**: Too large for most devices
- Models > 4GB unless device has 8GB+ RAM

## Success Indicators

✅ Models download without 401/403 errors  
✅ Models load without "function undefined" errors  
✅ Text generation works smoothly  
✅ App doesn't crash during model operations  
✅ Memory usage stays reasonable  
✅ File cleanup works properly  
✅ **SmolVLM2 vision features work** (image analysis, OCR, visual notes)  
✅ **VisionNoteEditor component** provides seamless image-to-text workflow  

## New Vision Features with SmolVLM2

### What SmolVLM2 Enables:
- 📷 **Image Analysis**: Describe images in detail
- 📄 **OCR**: Extract text from screenshots, documents, photos
- 📝 **Visual Notes**: Auto-generate notes from images
- 🔍 **Image Q&A**: Ask questions about image content
- 📊 **Document Analysis**: Analyze charts, graphs, diagrams

### Perfect for Note-Taking:
- Take photo of whiteboard → Auto-generate meeting notes
- Screenshot of article → Extract key points
- Photo of receipt → Create expense note
- Document scan → OCR + summarization
- Diagram/chart → Explain and analyze

The new implementation should resolve all the issues you were experiencing PLUS add powerful vision capabilities!
