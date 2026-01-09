# BuntingGPT Chat Interface Specification

> Complete technical documentation for the chat interface architecture, components, edge functions, database schema, and encryption system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Components](#frontend-components)
3. [React Hooks Architecture](#react-hooks-architecture)
4. [AI Model Routing](#ai-model-routing)
5. [Edge Functions](#edge-functions)
6. [Database Schema](#database-schema)
7. [Encryption System](#encryption-system)
8. [Conversation Management](#conversation-management)
9. [Auto-Summarization System](#auto-summarization-system)
10. [User Correction System](#user-correction-system)
11. [History Management](#history-management)
12. [File Handling](#file-handling)
13. [Subdomain Implementation](#subdomain-implementation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐      │
│  │  ChatInterface  │───▶│ ChatInputEnhanced │    │   ModelInfoPanel  │      │
│  │   (Orchestrator)│    │   (3x2 Toolbar)   │    │  (Welcome Screen) │      │
│  └────────┬────────┘    └──────────────────┘    └───────────────────┘      │
│           │                                                                  │
│           ▼                                                                  │
│  ┌─────────────────┐    ┌──────────────────┐                               │
│  │   MessageList   │───▶│   ChatMessage    │                               │
│  │  (Auto-scroll)  │    │ (Markdown render)│                               │
│  └─────────────────┘    └──────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HOOKS LAYER (State Management)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  useChatMessages (orchestrator)                                             │
│   ├── useChatState          → messages[], conversationId, loading           │
│   ├── useConversationPersistence → save/load encrypted conversations        │
│   ├── useMessageSending     → AI routing by queryType                       │
│   ├── useAutoSummary        → & prefix triggers KB contribution             │
│   ├── useCorrections        → user feedback on responses                    │
│   └── useAdaptiveRetrieval  → context lookup from don table                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EDGE FUNCTIONS (Supabase)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ generate-with-   │  │ generate-with-   │  │ generate-with-   │          │
│  │      groq        │  │   openai-o3      │  │     claude       │          │
│  │  (Llama 3.3-70b) │  │  (GPT-4o-mini)   │  │ (Claude Sonnet)  │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  manage-         │  │  save-ai-        │  │  handle-         │          │
│  │  conversations   │  │    summary       │  │  corrections     │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (Supabase/PostgreSQL)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ conversations│  │  corrections │  │ training_data│  │     don      │    │
│  │  (encrypted) │  │  (feedback)  │  │ (summaries)  │  │ (Bunting KB) │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input** → ChatInputEnhanced captures message + file attachments
2. **Query Routing** → ChatInterface determines queryType based on toggles
3. **Message Sending** → useMessageSending calls appropriate edge function
4. **AI Processing** → Edge function queries `don` table, calls AI model
5. **Response** → Message added to state, encrypted, saved to `conversations`
6. **Display** → MessageList renders ChatMessage components with markdown

---

## Frontend Components

### ChatInterface (`src/components/chat-interface.tsx`)

The main orchestrator component managing all chat functionality.

**Responsibilities:**
- Model toggle states (webEnabled, gpt4oEnabled, visionEnabled, imageGenEnabled)
- Query type routing based on active toggles and file uploads
- Conversation loading from URL params (`?conversation=uuid`)
- Auto-scroll behavior on new messages
- File upload handling and validation

**State Management:**
```typescript
const [webEnabled, setWebEnabled] = useState(false);
const [gpt4oEnabled, setGpt4oEnabled] = useState(false);
const [visionEnabled, setVisionEnabled] = useState(false);
const [imageGenEnabled, setImageGenEnabled] = useState(false);
```

**Query Type Resolution:**
```typescript
// Priority order for queryType determination
if (imageGenEnabled) return 'image-gen';
if (visionEnabled || hasImageFiles) return 'vision';
if (gpt4oEnabled) return 'gpt4o';
if (webEnabled) return 'web';
return undefined; // defaults to Groq
```

---

### ChatInputEnhanced (`src/components/chat-input-enhanced.tsx`)

3x2 toolbar grid with model toggles and actions.

**Layout:**
```
┌─────────────┬─────────────┐
│   New Chat  │   Upload    │
├─────────────┼─────────────┤
│ Web Search  │  GPT-4o     │
├─────────────┼─────────────┤
│   Vision    │  Generate   │
└─────────────┴─────────────┘
```

**Props:**
```typescript
interface ChatInputEnhancedProps {
  onSend: (message: string, files?: FileList) => void;
  onNewChat: () => void;
  onFileSelect: (files: FileList) => void;
  webEnabled: boolean;
  setWebEnabled: (enabled: boolean) => void;
  gpt4oEnabled: boolean;
  setGpt4oEnabled: (enabled: boolean) => void;
  visionEnabled: boolean;
  setVisionEnabled: (enabled: boolean) => void;
  imageGenEnabled: boolean;
  setImageGenEnabled: (enabled: boolean) => void;
  isLoading: boolean;
  selectedFiles: File[];
}
```

**File Validation:**
- Maximum 10MB per file
- Maximum 10 files per upload
- Supported types: images, PDFs, text files, CSV, JSON, Markdown

**Auto-Summarize Detection:**
- Messages prefixed with `&` trigger auto-summarization
- Prefix is stripped before sending to AI

---

### ChatMessage (`src/components/chat-message.tsx`)

Renders individual messages with markdown support.

**Features:**
- Markdown rendering with GitHub Flavored Markdown (remark-gfm)
- Code syntax highlighting (rehype-highlight)
- Copy to clipboard functionality
- Model badge display (shows which AI model was used)
- User avatar from profile
- Timestamp display
- Edit/correction button for assistant messages

**Markdown Configuration:**
```typescript
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
  components={{
    code: ({ inline, className, children }) => (
      // Custom code block with copy button
    ),
    a: ({ href, children }) => (
      // External links open in new tab
    ),
  }}
/>
```

---

### MessageList (`src/components/chat/message-list.tsx`)

Container for messages with auto-scroll behavior.

**Features:**
- Auto-scroll to bottom on new messages
- Maintains scroll position when viewing history
- Loading indicator during AI response
- Empty state when no messages

---

### ModelInfoPanel (`src/components/chat/model-info-panel.tsx`)

Welcome screen displayed when no messages exist.

**Sections:**
1. **Choose Your AI Mode** - Descriptions of available models
2. **Groq (Default)** - Fast responses, Bunting KB integration
3. **Web Search** - Real-time web search capability
4. **GPT-4o-mini** - OpenAI's efficient model
5. **Claude Vision** - Image analysis with Claude Sonnet
6. **Coming Soon** - Image Generation preview
7. **Upload** - Document analysis capability

---

## React Hooks Architecture

### useChatMessages (`src/hooks/use-chat-messages.ts`)

Main orchestrator hook that composes all chat functionality.

```typescript
export function useChatMessages() {
  // Compose child hooks
  const chatState = useChatState();
  const persistence = useConversationPersistence();
  const sending = useMessageSending();
  const autoSummary = useAutoSummary();
  const corrections = useCorrections();

  return {
    // State
    messages: chatState.messages,
    conversationId: chatState.conversationId,
    isLoading: chatState.isLoading,
    
    // Actions
    sendMessage: sending.sendMessage,
    loadConversation: persistence.loadConversation,
    saveConversation: persistence.saveConversation,
    clearMessages: chatState.clearMessages,
    submitCorrection: corrections.submitCorrection,
  };
}
```

---

### useChatState (`src/hooks/chat/use-chat-state.ts`)

Manages core message state.

```typescript
interface ChatState {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  autoSummarize?: boolean;
  queryType?: string;
  model?: string;
}
```

---

### useConversationPersistence (`src/hooks/chat/use-conversation-persistence.ts`)

Handles saving and loading encrypted conversations.

**Functions:**
- `saveConversation(messages, conversationId?)` - Encrypts and saves
- `loadConversation(conversationId)` - Loads and decrypts
- `deleteConversation(conversationId)` - Removes from database

**Encryption Flow:**
1. Get user's encryption salt from `profiles` table
2. Derive key using PBKDF2
3. Encrypt messages with AES-256-GCM
4. Store encrypted blob in `conversations.content`

---

### useMessageSending (`src/hooks/chat/use-message-sending.ts`)

Routes messages to appropriate AI edge function.

**Routing Logic:**
```typescript
async function sendMessage(
  content: string,
  queryType?: string,
  files?: File[]
) {
  const endpoint = getEndpoint(queryType);
  const payload = await buildPayload(content, files);
  
  const response = await supabase.functions.invoke(endpoint, {
    body: payload
  });
  
  return response.data;
}

function getEndpoint(queryType?: string): string {
  switch (queryType) {
    case 'web': return 'generate-with-groq';
    case 'gpt4o': return 'generate-with-openai-o3';
    case 'vision': return 'generate-with-claude';
    case 'image-gen': return 'generate-image';
    default: return 'generate-with-groq';
  }
}
```

---

### useAutoSummary (`src/hooks/chat/use-auto-summary.ts`)

Handles automatic knowledge base contribution.

**Trigger:** Message prefixed with `&` character

**Flow:**
1. Detect `&` prefix in user message
2. After AI response, extract last 2 messages
3. Call `save-ai-summary` edge function
4. GROQ summarizes and extracts factual knowledge
5. Store in `training_data` table with auto-generated embedding

---

### useCorrections (`src/hooks/chat/use-corrections.ts`)

Manages user feedback on AI responses.

**Functions:**
- `submitCorrection(messageId, correctionText)` - Submit correction
- `getCorrections(conversationId)` - Fetch existing corrections

---

### useAdaptiveRetrieval (`src/hooks/chat/use-adaptive-retrieval.ts`)

Provides context lookup from knowledge base.

**Features:**
- Queries `don` table for relevant context
- Uses embedding similarity for retrieval
- Injects context into AI prompts

---

## AI Model Routing

### Query Type to Edge Function Mapping

| Toggle State | queryType | Edge Function | AI Model | Use Case |
|--------------|-----------|---------------|----------|----------|
| Default (none) | `undefined` | `generate-with-groq` | Llama 3.3-70b | Fast general queries |
| Web Search ON | `web` | `generate-with-groq` | Llama 3.3-70b | Real-time web search |
| GPT-4o ON | `gpt4o` | `generate-with-openai-o3` | GPT-4o-mini | Complex reasoning |
| Vision ON | `vision` | `generate-with-claude` | Claude Sonnet 4 | Image analysis |
| Image files attached | `vision` | `generate-with-claude` | Claude Sonnet 4 | Auto-detected |
| Generate ON | `image-gen` | `generate-image` | Imagen 3 | Image generation |

### Toggle Priority

When multiple toggles are active, priority order:
1. Image Generation (highest)
2. Vision
3. GPT-4o
4. Web Search
5. Default Groq (lowest)

---

## Edge Functions

### Common Patterns

All AI edge functions share these patterns:

1. **Bunting KB Query** - Query `don` table for relevant context
2. **System Prompt** - Include product portfolio and company info
3. **Response Format** - No follow-up questions, cite "Bunting KB"
4. **Error Handling** - Graceful fallbacks with user-friendly messages

### Required API Keys

| Secret Name | Edge Functions |
|-------------|----------------|
| `GROQ_API_KEY` | generate-with-groq, save-ai-summary |
| `OPENAI_API_KEY` | generate-with-openai-o3, generate-with-openai-embeddings, generate-with-openai-gpt5 |
| `ANTHROPIC_API_KEY` | generate-with-claude |
| `GEMINI_API_KEY` | generate-image |

---

### generate-with-groq (`supabase/functions/generate-with-groq/index.ts`)

**Model:** Llama 3.3-70b (via Groq API)

**Features:**
- Fastest response times (~100ms)
- Web search integration when `enableWeb: true`
- Bunting KB context injection

**Request Payload:**
```typescript
{
  message: string;
  conversationHistory?: Message[];
  enableWeb?: boolean;
  userContext?: {
    department?: string;
    location?: string;
  };
}
```

---

### generate-with-openai-o3 (`supabase/functions/generate-with-openai-o3/index.ts`)

**Model:** GPT-4o-mini

**Features:**
- Complex reasoning capabilities
- Longer context window
- Better at structured outputs

**Request Payload:**
```typescript
{
  message: string;
  conversationHistory?: Message[];
  systemPrompt?: string;
}
```

---

### generate-with-claude (`supabase/functions/generate-with-claude/index.ts`)

**Model:** Claude Sonnet 4

**Features:**
- Vision/image analysis
- Large file processing (chunked)
- PDF text extraction

**Request Payload:**
```typescript
{
  message: string;
  conversationHistory?: Message[];
  files?: Array<{
    name: string;
    type: string;
    content: string; // base64
  }>;
}
```

**File Chunking:**
- Files >100KB are split into 50KB chunks
- Each chunk processed separately
- Results combined for final response

---

### manage-conversations (`supabase/functions/manage-conversations/index.ts`)

**Purpose:** CRUD operations for conversations

**Actions:**

| Action | Description | Parameters |
|--------|-------------|------------|
| `loadConversation` | Fetch by ID | `conversationId` |
| `saveConversation` | Create/update | `conversationId?`, `topic`, `content` |
| `listConversations` | All user convos | - |
| `deleteConversation` | Remove | `conversationId` |
| `searchConversations` | Search by topic/content | `query` |

---

### save-ai-summary (`supabase/functions/save-ai-summary/index.ts`)

**Purpose:** Extract and store factual knowledge from conversations

**Flow:**
1. Receive last 2 messages (user question + AI answer)
2. Use GROQ to summarize and extract facts
3. Store in `training_data` table
4. Database trigger generates embedding

---

### handle-corrections (`supabase/functions/handle-corrections/index.ts`)

**Purpose:** Process user corrections to AI responses

**Flow:**
1. Receive correction text and message context
2. Extract keywords and topic
3. Store in `corrections` table
4. Create `user_training_submissions` entry for admin review

---

## Database Schema

### conversations

Stores encrypted chat conversations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK to auth.users |
| `topic` | text | First 50 chars of first message |
| `content` | jsonb | **Encrypted** message array |
| `last_message_at` | timestamptz | For sorting |
| `created_at` | timestamptz | Auto-generated |
| `updated_at` | timestamptz | Auto-updated |

**RLS Policies:**
- Users can only access their own conversations

---

### corrections

Stores user feedback on AI responses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `message_id` | text | Reference to message |
| `conversation_id` | uuid | FK to conversations |
| `user_id` | uuid | FK to auth.users |
| `correction_text` | text | User's correction |
| `topic` | text | Extracted topic |
| `keywords` | text[] | Extracted keywords |
| `is_global` | boolean | Apply globally vs per-conversation |
| `applied` | boolean | Whether correction has been applied |
| `created_at` | timestamptz | Auto-generated |

---

### training_data

Stores auto-summarized knowledge contributions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `document_type` | enum | 'company', 'product', 'policy', etc. |
| `content` | jsonb | {title, summary, source, original_content} |
| `embedding` | vector | Auto-generated by DB trigger |
| `scope` | enum | 'global', 'user', 'department' |
| `user_id` | uuid | Contributor |
| `created_at` | timestamptz | Auto-generated |

---

### don (Bunting Knowledge Base)

Core institutional knowledge used by all AI models.

| Column | Type | Description |
|--------|------|-------------|
| `uuid` | uuid | Primary key |
| `narrative` | text | Institutional knowledge content |
| `embedding_b64_f16` | text | Pre-computed embedding (base64 float16) |

**Usage:**
- All edge functions query this table for context
- Embeddings enable semantic search
- Content is injected into AI system prompts

---

### profiles

User profiles including encryption settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key, FK to auth.users |
| `display_name` | text | User's display name |
| `avatar_url` | text | Profile picture URL |
| `encryption_salt` | text | Salt for conversation encryption |
| `created_at` | timestamptz | Auto-generated |
| `updated_at` | timestamptz | Auto-updated |

---

## Encryption System

### Overview

Conversations are encrypted client-side before storage using AES-256-GCM.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Messages   │────▶│   Encrypt   │────▶│   Store     │
│  (Array)    │     │ (AES-256)   │     │  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │           ┌─────────────┐
       │           │ PBKDF2 Key  │
       │           │ Derivation  │
       │           └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│   Decrypt   │◀────│   Load      │
│  (AES-256)  │     │  (Supabase) │
└─────────────┘     └─────────────┘
```

### Key Derivation

```typescript
// Key derivation using PBKDF2
const keyMaterial = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(`${userId}:encryption_key_v2`),
  'PBKDF2',
  false,
  ['deriveKey']
);

const key = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: new TextEncoder().encode(encryptionSalt),
    iterations: 100000,
    hash: 'SHA-256'
  },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

### Encryption Process

```typescript
async function encryptMessages(messages: Message[], userId: string, salt: string) {
  const key = await deriveKey(userId, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(messages))
  );
  
  return JSON.stringify({
    data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv))
  });
}
```

### Decryption Process

```typescript
async function decryptMessages(encryptedContent: string, userId: string, salt: string) {
  const { data, iv } = JSON.parse(encryptedContent);
  const key = await deriveKey(userId, salt);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Uint8Array.from(atob(iv), c => c.charCodeAt(0)) },
    key,
    Uint8Array.from(atob(data), c => c.charCodeAt(0))
  );
  
  return JSON.parse(new TextDecoder().decode(decrypted));
}
```

### Legacy Fallback

Older conversations used session tokens for encryption (problematic with session changes). The system attempts v2 decryption first, then falls back to legacy:

```typescript
try {
  // Try new v2 key first
  return await decryptWithV2Key(content, userId, salt);
} catch {
  // Fall back to legacy session-based key
  return await decryptWithLegacyKey(content, sessionToken, salt);
}
```

### Salt Management

- Salt stored in `profiles.encryption_salt`
- Generated on first conversation save if not exists
- 32-byte random value encoded as base64

---

## Conversation Management

### Save Flow

```typescript
async function saveConversation(messages: Message[], existingId?: string) {
  const user = await getUser();
  const salt = await getOrCreateSalt(user.id);
  const encrypted = await encryptMessages(messages, user.id, salt);
  
  const topic = messages[0]?.content.slice(0, 50) || 'New Conversation';
  
  await supabase.functions.invoke('manage-conversations', {
    body: {
      action: 'saveConversation',
      conversationId: existingId,
      topic,
      content: encrypted
    }
  });
}
```

### Load Flow

```typescript
async function loadConversation(conversationId: string) {
  const user = await getUser();
  const salt = await getSalt(user.id);
  
  const { data } = await supabase.functions.invoke('manage-conversations', {
    body: {
      action: 'loadConversation',
      conversationId
    }
  });
  
  return await decryptMessages(data.content, user.id, salt);
}
```

### Search

```typescript
async function searchConversations(query: string) {
  const { data } = await supabase.functions.invoke('manage-conversations', {
    body: {
      action: 'searchConversations',
      query
    }
  });
  
  // Returns conversations where topic matches (ilike)
  // Content search is manual post-fetch (encrypted)
  return data;
}
```

---

## Auto-Summarization System

### Trigger Detection

```typescript
function detectAutoSummarize(message: string): { shouldSummarize: boolean; cleanMessage: string } {
  if (message.startsWith('&')) {
    return {
      shouldSummarize: true,
      cleanMessage: message.slice(1).trim()
    };
  }
  return { shouldSummarize: false, cleanMessage: message };
}
```

### Summarization Flow

```
User: "&What are the specifications for the HF-15 separator?"
                    │
                    ▼
┌───────────────────────────────────────┐
│  1. Detect & prefix                   │
│  2. Strip prefix, send to AI          │
│  3. Get response about HF-15          │
│  4. After response, trigger summary   │
└───────────────────────────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│  save-ai-summary edge function        │
│  - Receives: user question + answer   │
│  - Extracts: factual knowledge        │
│  - Stores: training_data table        │
└───────────────────────────────────────┘
```

### Storage Format

```typescript
{
  document_type: 'product',
  content: {
    title: 'HF-15 Separator Specifications',
    summary: 'The HF-15 magnetic separator has a field strength of...',
    source: 'user_conversation',
    original_content: '...'
  },
  scope: 'global',
  user_id: 'uuid'
}
```

---

## User Correction System

### UI Flow

1. User hovers over assistant message
2. Clicks edit/pencil icon
3. `CorrectionDialog` opens
4. User enters correction text
5. Submit triggers `handle-corrections`

### Correction Processing

```typescript
// handle-corrections edge function
async function processCorrection(payload: {
  messageId: string;
  conversationId: string;
  correctionText: string;
  originalMessage: string;
}) {
  // Extract keywords using simple NLP
  const keywords = extractKeywords(payload.correctionText);
  
  // Determine topic
  const topic = await categorize(payload.correctionText);
  
  // Store correction
  await supabase.from('corrections').insert({
    message_id: payload.messageId,
    conversation_id: payload.conversationId,
    correction_text: payload.correctionText,
    keywords,
    topic,
    is_global: true
  });
  
  // Create training submission for admin review
  await supabase.from('user_training_submissions').insert({
    type: 'correction',
    content: payload.correctionText,
    context: payload.originalMessage,
    status: 'pending'
  });
}
```

---

## History Management

### History Page (`src/pages/History.tsx`)

**Features:**
- List all conversations with deduplication
- Search by topic and content
- Delete with confirmation dialog
- Show last model used per conversation
- Message count display
- Preview of last user message

### Conversation List Query

```typescript
const { data } = await supabase
  .from('conversations')
  .select('*')
  .eq('user_id', userId)
  .order('last_message_at', { ascending: false });
```

### Search Implementation

```typescript
// Topic search via database
const { data } = await supabase
  .from('conversations')
  .select('*')
  .eq('user_id', userId)
  .ilike('topic', `%${query}%`);

// Content search requires client-side decryption
// (encrypted content can't be searched server-side)
```

---

## File Handling

### Supported File Types

| Category | Extensions | Max Size | Processing |
|----------|------------|----------|------------|
| Images | jpg, png, gif, webp | 10MB | Base64, Claude Vision |
| Documents | pdf | 10MB | Text extraction, Claude |
| Text | txt, md, csv, json | 10MB | Direct read |
| Code | js, ts, py, etc. | 10MB | Direct read |

### File Processing

```typescript
async function processFile(file: File): Promise<ProcessedFile> {
  const isText = file.type.startsWith('text/') || 
                 ['json', 'md', 'csv'].some(ext => file.name.endsWith(ext));
  
  if (isText) {
    const content = await file.text();
    return {
      name: file.name,
      type: file.type,
      content: content.slice(0, 10000), // Preview limit
      isText: true
    };
  }
  
  // Binary files (images, PDFs)
  const base64 = await fileToBase64(file);
  return {
    name: file.name,
    type: file.type,
    content: base64.slice(0, 16000), // Preview limit
    isText: false
  };
}
```

### Large File Chunking

For files >100KB, content is chunked for Claude processing:

```typescript
function chunkContent(content: string, chunkSize = 50000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize));
  }
  return chunks;
}
```

---

## Subdomain Implementation

### Shared Resources

For creating a subdomain-specific chat interface (e.g., `chat.buntinggpt.com`):

**Shared (Same Supabase Project):**
- Database tables (conversations, corrections, training_data, don)
- Edge functions (all generate-* functions)
- Authentication (same auth.users)
- API keys and secrets

**Can Customize:**
- UI components and styling
- Feature toggles (which models available)
- System prompts per subdomain
- Branding and theming

### Authentication Sharing

See `auth.md` for cross-subdomain authentication using:
- Cookie-based session sharing
- PostMessage for iframe communication
- Token validation via edge functions

### Implementation Checklist

1. **Setup**
   - [ ] Point subdomain to deployment
   - [ ] Configure CORS for Supabase
   - [ ] Set up cookie domain (`.buntinggpt.com`)

2. **Copy/Reference**
   - [ ] Chat components (or simplified versions)
   - [ ] Hooks (use-chat-messages and children)
   - [ ] Encryption utilities
   - [ ] Types (Message, Conversation)

3. **Customize**
   - [ ] Remove unwanted model toggles
   - [ ] Adjust system prompts if needed
   - [ ] Apply subdomain-specific theming
   - [ ] Configure feature flags

4. **Test**
   - [ ] Authentication flow
   - [ ] Conversation save/load
   - [ ] Cross-subdomain conversation access
   - [ ] Model routing

---

## Cleanup Opportunities

### Identified for Future Refactoring

1. **Consolidate OpenAI Functions**
   - `generate-with-openai-o3` and `generate-with-openai-gpt5` both use GPT-4o-mini
   - Consider merging into single function with model parameter

2. **Remove Disabled Features**
   - Image generation toggle is disabled in UI but code remains
   - Clean up if not planned for near-term activation

3. **Unused Components**
   - `welcome-screen.tsx` may be redundant with `ModelInfoPanel`
   - Review and consolidate

4. **Hook Consolidation**
   - Consider merging `use-auto-summary.ts` into main hook
   - Evaluate if separate files add value

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-09 | Initial documentation |

---

*This document serves as the single source of truth for the BuntingGPT chat interface. Update when making architectural changes.*
