import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Video } from '../types';
import {
  Film,
  Plus,
  Search,
  SlidersHorizontal,
  Calendar,
  Clock,
  Youtube,
  ExternalLink,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import {
  formatSecondsDigital,
  formatSecondsHuman,
  formatMinutesDisplay,
} from '../lib/calculations';
import { EditVideoModal } from '../components/EditVideoModal';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

type SortOption = 'newest' | 'oldest' | 'longest' | 'shortest' | 'title';

export const VideosView: React.FC = () => {
  const {
    videos,
    deleteVideo,
    setIsAddVideoModalOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<Video | null>(null);

  // Extract distinct months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    videos.forEach((v) => {
      if (v.completion_date) {
        months.add(v.completion_date.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(months).sort().reverse();
  }, [videos]);

  // Filter & Sort Logic
  const filteredVideos = useMemo(() => {
    return videos
      .filter((video) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = video.title.toLowerCase().includes(q);
          const matchesNotes = video.notes?.toLowerCase().includes(q) || false;
          if (!matchesTitle && !matchesNotes) return false;
        }

        // Month filter
        if (selectedMonth !== 'all') {
          if (!video.completion_date.startsWith(selectedMonth)) return false;
        }

        // Duration filter
        if (durationFilter === 'short') {
          // < 20 min (1200 sec)
          if (video.duration_seconds >= 1200) return false;
        } else if (durationFilter === 'medium') {
          // 20-35 min (1200 to 2100 sec)
          if (video.duration_seconds < 1200 || video.duration_seconds > 2100) return false;
        } else if (durationFilter === 'long') {
          // > 35 min (2100 sec)
          if (video.duration_seconds <= 2100) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return b.completion_date.localeCompare(a.completion_date);
        if (sortBy === 'oldest') return a.completion_date.localeCompare(b.completion_date);
        if (sortBy === 'longest') return b.duration_seconds - a.duration_seconds;
        if (sortBy === 'shortest') return a.duration_seconds - b.duration_seconds;
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        return 0;
      });
  }, [videos, searchQuery, selectedMonth, durationFilter, sortBy]);

  // Total filtered runtime
  const filteredTotalSeconds = useMemo(() => {
    return filteredVideos.reduce((sum, v) => sum + v.duration_seconds, 0);
  }, [filteredVideos]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / itemsPerPage));
  const paginatedVideos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVideos.slice(start, start + itemsPerPage);
  }, [filteredVideos, currentPage, itemsPerPage]);

  return (
    <div id="videos-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Film className="w-6 h-6 text-emerald-400" />
            <span>Completed Videos Library</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing {filteredVideos.length} of {videos.length} videos • Total Filtered Runtime: {formatSecondsDigital(filteredTotalSeconds, true)} ({formatMinutesDisplay(filteredTotalSeconds / 60)})
          </p>
        </div>

        <button
          id="videos-add-btn"
          onClick={() => setIsAddVideoModalOpen(true)}
          className="self-start sm:self-auto py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Add Completed Video</span>
        </button>
      </div>

      {/* Filters & Search Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <input
              type="text"
              placeholder="Search by title or notes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Month Filter */}
          <div className="lg:col-span-3 relative">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Calendar Months</option>
              {availableMonths.map((m) => {
                const [y, mon] = m.split('-');
                const monthName = new Date(parseInt(y), parseInt(mon) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {monthName}
                  </option>
                );
              })}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Duration Filter */}
          <div className="lg:col-span-3 relative">
            <select
              value={durationFilter}
              onChange={(e) => {
                setDurationFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer"
            >
              <option value="all">All Durations</option>
              <option value="short">Short (&lt; 20 min)</option>
              <option value="medium">Medium (20 - 35 min)</option>
              <option value="long">Long (&gt; 35 min)</option>
            </select>
            <Clock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full pl-8 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors appearance-none cursor-pointer font-medium"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="longest">Longest Runtime</option>
              <option value="shortest">Shortest Runtime</option>
              <option value="title">Title A-Z</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
          </div>
        </div>

        {(searchQuery || selectedMonth !== 'all' || durationFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
            <span className="text-slate-400">
              Active filters applied ({filteredVideos.length} matches)
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMonth('all');
                setDurationFilter('all');
              }}
              className="text-emerald-400 hover:underline font-semibold"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Videos List / Table */}
      {filteredVideos.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No videos match your criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Try adjusting your search query or filter selections.
          </p>
          <button
            onClick={() => setIsAddVideoModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Completed Video</span>
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Video Title</th>
                  <th className="py-3.5 px-4 font-mono">Runtime</th>
                  <th className="py-3.5 px-4">Completion Date</th>
                  <th className="py-3.5 px-4">Month</th>
                  <th className="py-3.5 px-4">YouTube</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {paginatedVideos.map((video) => {
                  const date = new Date(video.completion_date);
                  const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });

                  return (
                    <tr key={video.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {video.title}
                        </div>
                        {video.notes && (
                          <div className="text-[11px] text-slate-400 truncate max-w-md mt-0.5 font-normal">
                            {video.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-200">
                          {formatSecondsDigital(video.duration_seconds, true)}
                        </span>
                        <span className="text-[11px] text-slate-400 ml-1.5">
                          ({formatSecondsHuman(video.duration_seconds)})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-mono">
                        {video.completion_date}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px]">
                          {monthName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {video.youtube_url ? (
                          <a
                            href={video.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                          >
                            <Youtube className="w-3.5 h-3.5" />
                            <span>Watch</span>
                            <ExternalLink className="w-3 h-3 opacity-70" />
                          </a>
                        ) : (
                          <span className="text-slate-400">No link</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingVideo(video)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Video"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingVideo(video)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {paginatedVideos.map((video) => (
              <div
                key={video.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-100">{video.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingVideo(video)}
                      className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingVideo(video)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Runtime:</span>
                    <span className="font-bold text-slate-200">
                      {formatSecondsDigital(video.duration_seconds, true)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Completed:</span>
                    <span className="text-slate-300">{video.completion_date}</span>
                  </div>
                </div>

                {video.notes && (
                  <p className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg">
                    "{video.notes}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 text-xs">
                  {video.youtube_url ? (
                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-rose-400 font-semibold"
                    >
                      <Youtube className="w-4 h-4" />
                      <span>Watch on YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">No YouTube link</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Page {currentPage} of {totalPages} ({filteredVideos.length} total)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit & Delete Dialogs */}
      <EditVideoModal
        video={editingVideo}
        isOpen={Boolean(editingVideo)}
        onClose={() => setEditingVideo(null)}
      />

      <DeleteConfirmDialog
        video={deletingVideo}
        isOpen={Boolean(deletingVideo)}
        onClose={() => setDeletingVideo(null)}
        onConfirm={() => {
          if (deletingVideo) deleteVideo(deletingVideo.id);
        }}
      />
    </div>
  );
};
