"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  getQuestions,
  saveQuestions,
  Question,
  getTopics,
  saveTopics,
  getCustomTags,
  saveCustomTags,
  TopicItem,
  getAdminUsers,
  AdminUser,
  getMedicalContent,
  MedicalContent,
  getAutofillTemplates,
  AutofillTemplate,
} from "@/lib/quizData";

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.02 } } };
const itemVariants = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } } };

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topicsList, setTopicsList] = useState<TopicItem[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [usersList, setUsersList] = useState<AdminUser[]>([]);
  const [contentList, setContentList] = useState<MedicalContent[]>([]);
  const [autofillList, setAutofillList] = useState<AutofillTemplate[]>([]);

  // Modals state
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicTags, setNewTopicTags] = useState<string[]>([]);
  const [newTopicTagInput, setNewTopicTagInput] = useState("");

  const [showNewTagModal, setShowNewTagModal] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleAddTopicTag = () => {
    const val = newTopicTagInput.trim();
    if (val && !newTopicTags.includes(val)) {
      setNewTopicTags([...newTopicTags, val]);
      setNewTopicTagInput("");
    }
  };

  const handleRemoveTopicTag = (tag: string) => {
    setNewTopicTags(newTopicTags.filter((t) => t !== tag));
  };

  const handleDeleteTopic = (topicName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the topic "${topicName}"?`)) {
      const updated = topicsList.filter((t) => t.name !== topicName);
      setTopicsList(updated);
      saveTopics(updated);
    }
  };

  const handleDeleteTag = (tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the tag "${tagName}"? This will also remove it from any assigned questions.`)) {
      const updatedCustom = customTags.filter((t) => t !== tagName);
      setCustomTags(updatedCustom);
      saveCustomTags(updatedCustom);

      const updatedQuestions = questions.map((q) => {
        if (q.tags && q.tags.includes(tagName)) {
          return { ...q, tags: q.tags.filter((t) => t !== tagName) };
        }
        return q;
      });
      setQuestions(updatedQuestions);
      saveQuestions(updatedQuestions);
    }
  };

  useEffect(() => {
    setQuestions(getQuestions());
    setTopicsList(getTopics());
    setCustomTags(getCustomTags());
    setUsersList(getAdminUsers());
    setContentList(getMedicalContent());
    setAutofillList(getAutofillTemplates());
  }, []);

  const hasResults = query.length > 2;

  // Filter questions based on search query
  const matchedQuestions = hasResults
    ? questions.filter(
        (q) =>
          q.text.toLowerCase().includes(query.toLowerCase()) ||
          q.id.toString().includes(query) ||
          q.topic.toLowerCase().includes(query.toLowerCase()) ||
          (q.tags && q.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())))
      )
    : [];

  const matchedUsers = hasResults
    ? usersList.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const matchedContent = hasResults
    ? [
        ...contentList.map((c) => ({ id: c.id, name: c.name, system: c.system, type: c.type, isTemplate: false })),
        ...autofillList.map((t) => ({ id: t.id, name: t.name, system: t.system, type: "Autofill", isTemplate: true }))
      ].filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.system.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const searchResults = {
    questions: matchedQuestions,
    users: matchedUsers,
    content: matchedContent,
  };

  // Compute tag cloud dynamically from the actual questions database + customTags
  const dynamicTags = (() => {
    const counts: { [key: string]: number } = {};
    customTags.forEach((tag) => {
      counts[tag] = 0;
    });
    questions.forEach((q) => {
      if (q.tags) {
        q.tags.forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  })();

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <AdminPageHeader
        title="Search &"
        highlightedText="Taxonomy"
        subtitle="Global search, topic management, and tag organization"
        variants={itemVariants}
      />

      {/* Global search */}
      <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-transparent to-teal-50/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="relative max-w-2xl mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search across questions, users, content, quizzes..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 text-base bg-white/80 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 transition-all" />
          </div>

        {hasResults && (
          <div className="mt-6">
            <div className="flex gap-2 mb-4">
              {["all", "questions", "users", "content"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeTab === tab ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-slate-500 border-slate-200"}`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  <span className="ml-1 text-[10px] opacity-60">
                    {tab === "all"
                      ? searchResults.questions.length + searchResults.users.length + searchResults.content.length
                      : tab === "questions"
                      ? searchResults.questions.length
                      : tab === "users"
                      ? searchResults.users.length
                      : searchResults.content.length}
                  </span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {(activeTab === "all" || activeTab === "questions") && searchResults.questions.map((r) => (
                <div
                  key={r.id}
                  onClick={() => router.push(`/admin/questions?id=${r.id}`)}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer animate-fade-in"
                >
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1.5 rounded shrink-0">Q</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate font-semibold">{r.text}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-slate-400">#{r.id}</span>
                      <span className="text-slate-300">·</span>
                      {/* Topic Tags */}
                      {r.topic.split(",").map((t) => (
                        <span key={t.trim()} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/50">
                          {t.trim()}
                        </span>
                      ))}
                      {r.tags && r.tags.length > 0 && (
                        <>
                          <span className="text-slate-300">·</span>
                          {/* Subtopic Tags */}
                          {r.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/50">
                              {tag}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(activeTab === "all" || activeTab === "users") && searchResults.users.map((r) => (
                <div
                  key={r.id}
                  onClick={() => router.push(`/admin/users`)}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer"
                >
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">U</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{r.name}</p>
                    <p className="text-xs text-slate-400">ID #{r.id} · {r.plan} · {r.status}</p>
                  </div>
                </div>
              ))}
              {(activeTab === "all" || activeTab === "content") && searchResults.content.map((r) => (
                <div
                  key={r.name}
                  onClick={() => router.push(r.isTemplate ? `/admin/autofill/${r.id}` : `/admin/content/${r.id}`)}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 cursor-pointer"
                >
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{r.isTemplate ? "T" : "C"}</span>
                  <div className="flex-1 min-w-0"><p className="text-sm text-slate-700">{r.name}</p><p className="text-xs text-slate-400">{r.type} · {r.system}</p></div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic management */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white shadow-md shadow-slate-200/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="px-6 py-4 border-b border-slate-200/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Topics</h3>
              <button onClick={() => setShowAddTopicModal(true)} className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50/70 border border-teal-100/60 rounded-lg hover:bg-teal-100 transition-all">+ Add Topic</button>
            </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {topicsList.map((t) => (
              <div
                key={t.name}
                className="px-6 py-3.5 flex items-center justify-between hover:bg-teal-50/20 hover:shadow-[inset_4px_0_0_0_#14b8a6] transition-all duration-200 group cursor-pointer"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.subtopics} subtopics</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{t.questions} Q</span>
                  <span>{t.usage.toLocaleString()} uses</span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTopic(t.name, e)}
                    className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title={`Delete topic "${t.name}"`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        </motion.div>

        {/* Tag management */}
        <motion.div variants={itemVariants} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white p-6 shadow-md shadow-slate-200/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-transparent to-teal-50/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Tag Cloud</h3>
              <button onClick={() => setShowNewTagModal(true)} className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50/70 border border-teal-100/60 rounded-lg hover:bg-teal-100 transition-all">+ New Tag</button>
            </div>
          <div className="flex flex-wrap gap-2">
            {dynamicTags.sort((a, b) => b.count - a.count).map((tag) => {
              const size = tag.count > 3 ? "text-sm" : tag.count > 1 ? "text-xs" : "text-[11px]";
              const weight = tag.count > 3 ? "font-bold" : tag.count > 1 ? "font-semibold" : "font-medium";
              return (
                <div
                  key={tag.name}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:border-teal-300 hover:bg-teal-50/50 transition-all group/tag ${size} ${weight}`}
                >
                  <span
                    onClick={() => {
                      setQuery(tag.name);
                      setActiveTab("questions");
                    }}
                    className="cursor-pointer hover:text-teal-700"
                  >
                    {tag.name} <span className="opacity-40 ml-1">{tag.count}</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTag(tag.name, e)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-1 text-sm focus:outline-none transition-colors animate-fade-in"
                    title={`Delete tag "${tag.name}"`}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>

          {/* Index rebuild */}
          <div className="mt-6 pt-5 border-t border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Search Index</h4>
            <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Last rebuilt: <span className="font-medium">2 hours ago</span></p>
                <p className="text-xs text-slate-400">Index size: 24.3 MB · 4,847 items</p>
              </div>
              <button className="px-4 py-2 text-xs font-medium text-teal-700 bg-white border border-teal-200 rounded-lg hover:bg-teal-50 transition-all">Rebuild Index</button>
            </div>
          </div>
          </div>
        </motion.div>
      </div>

      {/* Add Topic Modal */}
      <AnimatePresence>
        {showAddTopicModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] cursor-pointer"
              onClick={() => setShowAddTopicModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed inset-x-4 top-[25%] mx-auto max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-[70] shadow-2xl p-6 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold">Add New Topic</h3>
                <button
                  onClick={() => setShowAddTopicModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Topic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Immunology, Neurology"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Subtopic Tags (Add multiple)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Heart Failure, ECG, Acne"
                      value={newTopicTagInput}
                      onChange={(e) => setNewTopicTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTopicTag();
                        }
                      }}
                      className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddTopicTag}
                      className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Tag Pills List */}
                  {newTopicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 p-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-slate-100/60 dark:border-slate-800/40">
                      {newTopicTags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/40">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTopicTag(tag)}
                            className="text-teal-500 hover:text-red-500 font-bold ml-1 text-base focus:outline-none"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowAddTopicModal(false);
                      setNewTopicName("");
                      setNewTopicTags([]);
                      setNewTopicTagInput("");
                    }}
                    className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const name = newTopicName.trim();
                      if (!name) {
                        alert("Please enter a topic name.");
                        return;
                      }
                      if (topicsList.some(t => t.name.toLowerCase() === name.toLowerCase())) {
                        alert("Topic already exists.");
                        return;
                      }
                      const updatedTopics = [...topicsList, { name, questions: 0, usage: 0, subtopics: newTopicTags.length, subtopicTags: newTopicTags }];
                      setTopicsList(updatedTopics);
                      saveTopics(updatedTopics);

                      const newCustomTags = [...customTags];
                      let updatedCustomTags = false;
                      newTopicTags.forEach((tag) => {
                        if (!newCustomTags.includes(tag)) {
                          newCustomTags.push(tag);
                          updatedCustomTags = true;
                        }
                      });
                      if (updatedCustomTags) {
                        setCustomTags(newCustomTags);
                        saveCustomTags(newCustomTags);
                      }

                      setShowAddTopicModal(false);
                      setNewTopicName("");
                      setNewTopicTags([]);
                      setNewTopicTagInput("");
                    }}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow"
                  >
                    Add Topic
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Tag Modal */}
      <AnimatePresence>
        {showNewTagModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[60] cursor-pointer"
              onClick={() => setShowNewTagModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed inset-x-4 top-[25%] mx-auto max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl z-[70] shadow-2xl p-6 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold">Create New Tag</h3>
                <button
                  onClick={() => setShowNewTagModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tag Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Immunology, Trauma, Gynaecology"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all dark:text-slate-100"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowNewTagModal(false)}
                    className="px-4 py-2 text-sm font-semibold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const name = newTagName.trim();
                      if (!name) {
                        alert("Please enter a tag name.");
                        return;
                      }
                      const allExistingTags = Array.from(new Set([
                        ...customTags,
                        ...questions.flatMap(q => q.tags || [])
                      ]));
                      if (allExistingTags.some(t => t.toLowerCase() === name.toLowerCase())) {
                        alert("Tag already exists.");
                        return;
                      }
                      const updated = [...customTags, name];
                      setCustomTags(updated);
                      saveCustomTags(updated);
                      setShowNewTagModal(false);
                      setNewTagName("");
                    }}
                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all shadow"
                  >
                    Create Tag
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
