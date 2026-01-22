# Retrieval-Augmented Generation for Large Language Models: A Survey

**Authors:** Yunfan Gao, Yun Xiong, Xinyu Gao, Kangxiang Jia, Jinliu Pan, Yuxi Bi, Yi Dai, Jiawei Sun, Meng Wang, and Haofen Wang

**Affiliations:**
- Shanghai Research Institute for Intelligent Autonomous Systems, Tongji University
- Shanghai Key Laboratory of Data Science, School of Computer Science, Fudan University
- College of Design and Innovation, Tongji University

## Abstract

Large Language Models (LLMs) showcase impressive capabilities but encounter challenges like hallucination, outdated knowledge, and non-transparent, untraceable reasoning processes. Retrieval-Augmented Generation (RAG) has emerged as a promising solution by incorporating knowledge from external databases. This enhances the accuracy and credibility of the generation, particularly for knowledge-intensive tasks, and allows for continuous knowledge updates and integration of domain-specific information. RAG synergistically merges LLMs' intrinsic knowledge with the vast, dynamic repositories of external databases. This comprehensive review paper offers a detailed examination of the progression of RAG paradigms, encompassing the Naive RAG, the Advanced RAG, and the Modular RAG. It meticulously scrutinizes the tripartite foundation of RAG frameworks, which includes the retrieval, the generation and the augmentation techniques. The paper highlights the state-of-the-art technologies embedded in each of these critical components, providing a profound understanding of the advancements in RAG systems. Furthermore, this paper introduces up-to-date evaluation framework and benchmark. At the end, this article delineates the challenges currently faced and points out prospective avenues for research and development.

**Index Terms:** Large language model, retrieval-augmented generation, natural language processing, information retrieval

## I. INTRODUCTION

Large language models (LLMs) have achieved remarkable success, though they still face significant limitations, especially in domain-specific or knowledge-intensive tasks, notably producing "hallucinations" when handling queries beyond their training data or requiring current information. To overcome challenges, Retrieval-Augmented Generation (RAG) enhances LLMs by retrieving relevant document chunks from external knowledge base through semantic similarity calculation. By referencing external knowledge, RAG effectively reduces the problem of generating factually incorrect content. Its integration into LLMs has resulted in widespread adoption, establishing RAG as a key technology in advancing chatbots and enhancing the suitability of LLMs for real-world applications.

RAG technology has rapidly developed in recent years. The development trajectory of RAG in the era of large models exhibits several distinct stage characteristics. Initially, RAG's inception coincided with the rise of the Transformer architecture, focusing on enhancing language models by incorporating additional knowledge through Pre-Training Models (PTM). This early stage was characterized by foundational work aimed at refining pre-training techniques. The subsequent arrival of ChatGPT marked a pivotal moment, with LLM demonstrating powerful in context learning (ICL) capabilities. RAG research shifted towards providing better information for LLMs to answer more complex and knowledge-intensive tasks during the inference stage, leading to rapid development in RAG studies. As research progressed, the enhancement of RAG was no longer limited to the inference stage but began to incorporate more with LLM fine-tuning techniques.

The burgeoning field of RAG has experienced swift growth, yet it has not been accompanied by a systematic synthesis that could clarify its broader trajectory. This survey endeavors to fill this gap by mapping out the RAG process and charting its evolution and anticipated future paths, with a focus on the integration of RAG within LLMs.

### Our Contributions

- In this survey, we present a thorough and systematic review of the state-of-the-art RAG methods, delineating its evolution through paradigms including naive RAG, advanced RAG, and modular RAG. This review contextualizes the broader scope of RAG research within the landscape of LLMs.

- We identify and discuss the central technologies integral to the RAG process, specifically focusing on the aspects of "Retrieval", "Generation" and "Augmentation", and delve into their synergies, elucidating how these components intricately collaborate to form a cohesive and effective RAG framework.

- We have summarized the current assessment methods of RAG, covering 26 tasks, nearly 50 datasets, outlining the evaluation objectives and metrics, as well as the current evaluation benchmarks and tools. Additionally, we anticipate future directions for RAG, emphasizing potential enhancements to tackle current challenges.

## II. OVERVIEW OF RAG

A typical application of RAG is illustrated in a standard use case where a user poses a question to ChatGPT about recent, widely discussed news. Given ChatGPT's reliance on pre-training data, it initially lacks the capacity to provide updates on recent developments. RAG bridges this information gap by sourcing and incorporating knowledge from external databases. In this case, it gathers relevant news articles related to the user's query. These articles, combined with the original question, form a comprehensive prompt that empowers LLMs to generate a well-informed answer.

The RAG research paradigm is continuously evolving, and we categorize it into three stages: **Naive RAG**, **Advanced RAG**, and **Modular RAG**. Despite RAG methods being cost-effective and surpassing the performance of the native LLM, they also exhibit several limitations. The development of Advanced RAG and Modular RAG is a response to these specific shortcomings in Naive RAG.

### A. Naive RAG

The Naive RAG research paradigm represents the earliest methodology, which gained prominence shortly after the widespread adoption of ChatGPT. The Naive RAG follows a traditional process that includes indexing, retrieval, and generation, which is also characterized as a "Retrieve-Read" framework.

**Indexing** starts with the cleaning and extraction of raw data in diverse formats like PDF, HTML, Word, and Markdown, which is then converted into a uniform plain text format. To accommodate the context limitations of language models, text is segmented into smaller, digestible chunks. Chunks are then encoded into vector representations using an embedding model and stored in vector database. This step is crucial for enabling efficient similarity searches in the subsequent retrieval phase.

**Retrieval:** Upon receipt of a user query, the RAG system employs the same encoding model utilized during the indexing phase to transform the query into a vector representation. It then computes the similarity scores between the query vector and the vector of chunks within the indexed corpus. The system prioritizes and retrieves the top K chunks that demonstrate the greatest similarity to the query. These chunks are subsequently used as the expanded context in prompt.

**Generation:** The posed query and selected documents are synthesized into a coherent prompt to which a large language model is tasked with formulating a response. The model's approach to answering may vary depending on task-specific criteria, allowing it to either draw upon its inherent parametric knowledge or restrict its responses to the information contained within the provided documents.

However, Naive RAG encounters notable drawbacks:

- **Retrieval Challenges:** The retrieval phase often struggles with precision and recall, leading to the selection of misaligned or irrelevant chunks, and the missing of crucial information.

- **Generation Difficulties:** In generating responses, the model may face the issue of hallucination, where it produces content not supported by the retrieved context. This phase can also suffer from irrelevance, toxicity, or bias in the outputs.

- **Augmentation Hurdles:** Integrating retrieved information with different tasks can be challenging, sometimes resulting in disjointed or incoherent outputs. The process may also encounter redundancy when similar information is retrieved from multiple sources.

### B. Advanced RAG

Advanced RAG introduces specific improvements to overcome the limitations of Naive RAG. Focusing on enhancing retrieval quality, it employs pre-retrieval and post-retrieval strategies.

**Pre-retrieval process:** In this stage, the primary focus is on optimizing the indexing structure and the original query. The goal of optimizing indexing is to enhance the quality of the content being indexed. This involves strategies: enhancing data granularity, optimizing index structures, adding metadata, alignment optimization, and mixed retrieval. The goal of query optimization is to make the user's original question clearer and more suitable for the retrieval task. Common methods include query rewriting, query transformation, query expansion and other techniques.

**Post-Retrieval Process:** Once relevant context is retrieved, it's crucial to integrate it effectively with the query. The main methods in post-retrieval process include rerank chunks and context compressing. Re-ranking the retrieved information to relocate the most relevant content to the edges of the prompt is a key strategy. Feeding all relevant documents directly into LLMs can lead to information overload. To mitigate this, post-retrieval efforts concentrate on selecting the essential information, emphasizing critical sections, and shortening the context to be processed.

### C. Modular RAG

The modular RAG architecture advances beyond the former two RAG paradigms, offering enhanced adaptability and versatility. It incorporates diverse strategies for improving its components, such as adding a search module for similarity searches and refining the retriever through fine-tuning.

**New Modules:** The Modular RAG framework introduces additional specialized components:

- **Search module:** Adapts to specific scenarios, enabling direct searches across various data sources like search engines, databases, and knowledge graphs
- **Memory module:** Leverages the LLM's memory to guide retrieval
- **Routing:** Navigates through diverse data sources, selecting the optimal pathway for a query
- **Predict module:** Aims to reduce redundancy and noise by generating context directly through the LLM
- **Task Adapter module:** Tailors RAG to various downstream tasks

**New Patterns:** Modular RAG offers remarkable adaptability by allowing module substitution or reconfiguration to address specific challenges. Innovations include:

- **Rewrite-Retrieve-Read:** Leverages LLM capabilities to refine retrieval queries
- **Generate-Read:** Replaces traditional retrieval with LLM-generated content
- **Hybrid retrieval strategies:** Integrate keyword, semantic, and vector searches
- **Adaptive retrieval:** Techniques like FLARE and Self-RAG that evaluate the necessity of retrieval based on different scenarios

### D. RAG vs Fine-tuning

RAG excels in dynamic environments by offering real-time knowledge updates and effective utilization of external knowledge sources with high interpretability. However, it comes with higher latency and ethical considerations regarding data retrieval. On the other hand, Fine-tuning (FT) is more static, requiring retraining for updates but enabling deep customization of the model's behavior and style.

The choice between RAG and FT depends on the specific needs for data dynamics, customization, and computational capabilities in the application context. RAG and FT are not mutually exclusive and can complement each other, enhancing a model's capabilities at different levels.

## III. RETRIEVAL

In the context of RAG, it is crucial to efficiently retrieve relevant documents from the data source. There are several key issues involved, such as the retrieval source, retrieval granularity, pre-processing of the retrieval, and selection of the corresponding embedding model.

### A. Retrieval Source

**1) Data Structure:**

- **Unstructured Data:** Text is the most widely used retrieval source, mainly gathered from corpus. For open-domain question-answering (ODQA) tasks, the primary retrieval sources are Wikipedia Dump.

- **Semi-structured data:** Typically refers to data that contains a combination of text and table information, such as PDF. Handling semi-structured data poses challenges for conventional RAG systems.

- **Structured data:** Such as knowledge graphs (KGs), which are typically verified and can provide more precise information.

- **LLMs-Generated Content:** Some research has focused on exploiting LLMs' internal knowledge, where the model generates context rather than retrieving from external sources.

**2) Retrieval Granularity:** 

In text, retrieval granularity ranges from fine to coarse, including Token, Phrase, Sentence, Proposition, Chunks, Document. On the Knowledge Graph (KG), retrieval granularity includes Entity, Triplet, and sub-Graph.

### B. Indexing Optimization

**1) Chunking Strategy:** The most common method is to split the document into chunks on a fixed number of tokens (e.g., 100, 256, 512). Larger chunks can capture more context but generate more noise. Smaller chunks may not fully convey the necessary context but have less noise.

**2) Metadata Attachments:** Chunks can be enriched with metadata information such as page number, file name, author, category timestamp. Subsequently, retrieval can be filtered based on this metadata.

**3) Structural Index:**
- **Hierarchical index structure:** Files are arranged in parent-child relationships, with chunks linked to them
- **Knowledge Graph index:** Utilize KG in constructing the hierarchical structure of documents

### C. Query Optimization

**1) Query Expansion:** Expanding a single query into multiple queries enriches the content of the query. Methods include:
- **Multi-Query:** Employing prompt engineering to expand queries via LLMs
- **Sub-Query:** Decomposing complex questions into simpler sub-questions
- **Chain-of-Verification (CoVe):** Validating expanded queries to reduce hallucinations

**2) Query Transformation:**
- **Query Rewrite:** Prompting LLM to rewrite queries for better retrieval
- **HyDE:** Constructing hypothetical documents (assumed answers)
- **Step-back Prompting:** Abstracting queries to generate high-level concept questions

**3) Query Routing:**
- **Metadata Router/Filter:** Extracting keywords and filtering based on metadata
- **Semantic Router:** Using semantic information for routing
- **Hybrid routing:** Combining semantic and metadata-based methods

### D. Embedding

Retrieval is achieved by calculating the similarity between the embeddings of the question and document chunks. Recent prominent embedding models include AngIE, Voyage, BGE, etc.

**1) Mix/hybrid Retrieval:** Sparse and dense embedding approaches capture different relevance features and can benefit from each other.

**2) Fine-tuning Embedding Model:** Essential when context significantly deviates from pre-training corpus, particularly in specialized disciplines.

### E. Adapter

External adapters can be incorporated to aid in alignment when fine-tuning models presents challenges, such as integrating functionality through an API or addressing computational constraints.

## IV. GENERATION

After retrieval, adjustments are needed from two perspectives: adjusting the retrieved content and adjusting the LLM.

### A. Context Curation

**1) Reranking:** Reorders document chunks to highlight the most pertinent results first, using rule-based or model-based approaches.

**2) Context Selection/Compression:** Methods to reduce context length while preserving key information:
- **LLMLingua:** Detects and removes unimportant tokens
- **PRCA:** Trains an information extractor
- **RECOMP:** Trains an information condenser
- **Filter-Reranker paradigm:** Combines strengths of LLMs and SLMs

### B. LLM Fine-tuning

Targeted fine-tuning based on scenario and data characteristics can yield better results:

- Providing additional domain knowledge
- Adjusting model's input and output formats
- Aligning with human or retriever preferences through reinforcement learning
- Distilling more powerful models
- Coordinating with retriever fine-tuning

## V. AUGMENTATION PROCESS IN RAG

### A. Iterative Retrieval

Iterative retrieval involves repeatedly searching the knowledge base based on the initial query and the text generated so far, providing more comprehensive knowledge. This approach has been shown to enhance the robustness of subsequent answer generation.

### B. Recursive Retrieval

Recursive retrieval involves iteratively refining search queries based on results from previous searches. It creates a feedback loop that gradually converges on the most pertinent information. Useful for complex scenarios where user needs are not entirely clear or information is highly specialized.

### C. Adaptive Retrieval

Adaptive retrieval methods enable LLMs to actively determine the optimal moments and content for retrieval. Examples include:

- **FLARE:** Automates timing retrieval by monitoring generation confidence
- **Self-RAG:** Introduces "reflection tokens" allowing model to introspect outputs
- **WebGPT:** Integrates reinforcement learning framework for autonomous search engine use

## VI. TASK AND EVALUATION

### A. Downstream Task

The core task of RAG remains Question Answering (QA), including:
- Traditional single-hop/multi-hop QA
- Multiple-choice questions
- Domain-specific QA
- Long-form QA scenarios

RAG is also expanding to:
- Information Extraction (IE)
- Dialogue generation
- Code search
- Recommendation systems
- Text summarization
- Fact checking

### B. Evaluation Target

**Retrieval Quality:** Measured using metrics such as Hit Rate, MRR, and NDCG from search engines and information retrieval systems.

**Generation Quality:** Assessment can be categorized based on content objectives:
- For unlabeled content: faithfulness, relevance, and non-harmfulness
- For labeled content: accuracy of information produced

### C. Evaluation Aspects

**1) Quality Scores:**
- **Context Relevance:** Evaluates precision and specificity of retrieved context
- **Answer Faithfulness:** Ensures generated answers remain true to retrieved context
- **Answer Relevance:** Requires generated answers are directly pertinent to posed questions

**2) Required Abilities:**
- **Noise Robustness:** Capability to manage noise documents
- **Negative Rejection:** Discernment in refraining from responding when documents lack necessary knowledge
- **Information Integration:** Proficiency in synthesizing information from multiple documents
- **Counterfactual Robustness:** Ability to recognize and disregard known inaccuracies

### D. Evaluation Benchmarks and Tools

Prominent benchmarks and tools include:
- **RGB, RECALL, CRUD:** Focus on appraising essential abilities
- **RAGAS, ARES, TruLens:** Employ LLMs to adjudicate quality scores

## VII. DISCUSSION AND FUTURE PROSPECTS

### A. RAG vs Long Context

With LLMs now managing contexts exceeding 200,000 tokens, RAG still plays an irreplaceable role:
- Chunked retrieval improves operational efficiency
- RAG-based generation allows quick location of original references
- The retrieval and reasoning process is observable vs. black box long context
- Expansion of context provides new opportunities for RAG development

### B. RAG Robustness

Improving RAG's resistance to adversarial or counterfactual inputs is gaining research momentum. The presence of noise or contradictory information can detrimentally affect RAG's output quality. Developing specialized strategies to integrate retrieval with language generation models is crucial.

### C. Hybrid Approaches

Combining RAG with fine-tuning is emerging as a leading strategy. Key questions include:
- Optimal integration methods (sequential, alternating, or end-to-end joint training)
- How to harness both parameterized and non-parameterized advantages
- Introducing SLMs with specific functionalities into RAG

### D. Scaling Laws of RAG

While scaling laws are established for LLMs, their applicability to RAG remains uncertain. The possibility of an Inverse Scaling Law, where smaller models outperform larger ones, is particularly intriguing.

### E. Production-Ready RAG

Critical engineering challenges include:
- Enhancing retrieval efficiency
- Improving document recall in large knowledge bases
- Ensuring data security
- Preventing inadvertent disclosure of document sources or metadata

The development of the RAG ecosystem is greatly impacted by progression of technical stack:
- Key tools: LangChain, LLamaIndex
- Emerging technologies: Flowise AI, HayStack, Meltano, Cohere Coral
- Traditional providers expanding: Weaviate's Verba, Amazon's Kendra

### F. Multi-modal RAG

RAG has transcended text-based confines, embracing diverse modal data:

- **Image:** RA-CM3, BLIP-2, "Visualize Before You Write"
- **Audio and Video:** GSS method, UEOP, Vid2Seq
- **Code:** RBPS for code example retrieval
- **Structured Knowledge:** CoK method for knowledge graph integration

## VIII. CONCLUSION

This survey emphasizes RAG's significant advancement in enhancing LLM capabilities by integrating parameterized knowledge from language models with extensive non-parameterized data from external knowledge bases. The analysis outlines three developmental paradigms within the RAG framework: Naive, Advanced, and Modular RAG, each representing progressive enhancement.

RAG's technical integration with other AI methodologies, such as fine-tuning and reinforcement learning, has further expanded its capabilities. Despite progress, research opportunities remain to improve robustness and extended context handling.

RAG's application scope is expanding into multimodal domains, adapting its principles to interpret and process diverse data forms. The growing ecosystem is evidenced by the rise in RAG-centric AI applications and continuous development of supportive tools.

As RAG's landscape broadens, there is a need to refine evaluation methodologies to keep pace with evolution, ensuring accurate and representative performance assessments for the AI research and development community.

---

**Resources:** https://github.com/Tongji-KGLLM/RAG-Survey

**Citation:** arXiv:2312.10997v5 [cs.CL] 27 Mar 2024
