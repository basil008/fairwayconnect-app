"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAdminAuth, AdminHeader } from "@/components/AdminAuth";
import StaleHandicapWarning from "@/components/StaleHandicapWarning";
type Tab =
  | "details"
  | "players"
  | "teetimes"
  | "payments"
  | "prizes"
  | "scorecards"
  | "sidecomps"
  | "results";

interface EventData {
  event: Record<string, unknown>;
  holes: Array<{
    hole_number: number;
    par: number;
    stroke_index: number;
    yardage: number;
  }>;
  rsvps: Array<{
    id: string;
    member_id: string;
    name: string;
    handicap: number;
    status: string;
    member_type: string;
    can_enter_scores: number;
  }>;
  teeTimes: Array<{
    id: string;
    group_number: number;
    tee_time: string;
    member_ids: string;
    members: Array<{ id: string; name: string; handicap: number }>;
  }>;
  scorecards: Array<{
    id: string;
    member_id: string;
    name: string;
    handicap: number;
    status: string;
    total_points: number;
    total_gross: number;
    holes_completed: number;
  }>;
  sideComps: Array<{
    id: string;
    type: string;
    hole_number: number;
    member_name: string;
    value: number;
    unit: string;
    member_id: string;
  }>;
  prizes: Array<{
    id: string;
    prize_type: string;
    label: string;
    member_name: string;
    value: number;
  }>;
}

export default function AdminEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isAuth, checking, logout } = useAdminAuth();
  const [data, setData] = useState<EventData | null>(null);
  const [tab, setTab] = useState<Tab>("details");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Detail editing
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});

  // Side comp form
  const [sideCompForm, setSideCompForm] = useState({
    type: "ntp",
    hole_number: 7,
    member_id: "",
    value: 0,
    unit: "metres",
  });
  const [sidePlayerSearch, setSidePlayerSearch] = useState("");
  // Independent state for NTP and LD
  const [ntpHole, setNtpHole] = useState(0);
  const [ntpMemberId, setNtpMemberId] = useState("");
  const [ntpSearch, setNtpSearch] = useState("");
  const [ldHole, setLdHole] = useState(0);
  const [ldMemberId, setLdMemberId] = useState("");
  const [ldSearch, setLdSearch] = useState("");

  // Stale handicap warning
  const [showStaleWarning, setShowStaleWarning] = useState(false);
  const [staleMembers, setStaleMembers] = useState<any[]>([]);
  const [pendingScoreOpen, setPendingScoreOpen] = useState(false);
  const [twosHole, setTwosHole] = useState(0);
  const [twosMemberId, setTwosMemberId] = useState("");
  const [twosSearch, setTwosSearch] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorHandicap, setVisitorHandicap] = useState("");
  const [visitorPoints, setVisitorPoints] = useState("");

  // Score entry state
  const [scoreEntryPlayer, setScoreEntryPlayer] = useState<{
    member_id: string;
    name: string;
    handicap: number;
  } | null>(null);
  const [holeScores, setHoleScores] = useState<number[]>(Array(18).fill(0));
  const [savingScores, setSavingScores] = useState(false);

  // Quick handicap edit state
  const [editingHandicap, setEditingHandicap] = useState<{
    member_id: string;
    name: string;
    current_handicap: number;
  } | null>(null);
  const [newHandicap, setNewHandicap] = useState<string>("");
  const [savingHandicap, setSavingHandicap] = useState(false);

  // Tee time editing state
  const [movingPlayer, setMovingPlayer] = useState<{
    memberId: string;
    name: string;
    fromGroup: number;
  } | null>(null);
  const [editingTime, setEditingTime] = useState<{
    groupId: string;
    time: string;
  } | null>(null);
  const [savingTeeTimes, setSavingTeeTimes] = useState(false);

  // Player removal
  const [removingPlayer, setRemovingPlayer] = useState<string | null>(null);

  // DNS (Did Not Show) state
  const [dnsModal, setDnsModal] = useState<{
    teeTimeId: string;
    memberId: string;
    memberName: string;
  } | null>(null);
  const [dnsReason, setDnsReason] = useState<string>("Withdrew");
  const [markingDns, setMarkingDns] = useState(false);

  // Add player to tee time
  const [addingToGroup, setAddingToGroup] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [allMembers, setAllMembers] = useState<
    Array<{
      id: string;
      name: string;
      handicap: number;
      rsvp_status: string | null;
    }>
  >([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Course/Tee selection
  interface CourseTee {
    id: string;
    tee_color: string;
    slope_rating: number;
    course_rating: number;
    par: number;
  }
  interface Course {
    id: string;
    name: string;
    location: string;
    tees: CourseTee[];
  }
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Prize configuration state
  const [manualPrizes, setManualPrizes] = useState(false);
  const [prizeConfig, setPrizeConfig] = useState({
    first: 80,
    second: 60,
    third: 40,
    front9: 25,
    back9: 25,
    twos: 0,
    visitor: 0,
    class1_first: 40,
    class1_second: 30,
    class2_first: 40,
    class2_second: 30,
    longest_drive: 20,
    nearest_pin: 20,
  });
  const [savingPrizes, setSavingPrizes] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  // Scorecard loading state
  const [loadingScorecard, setLoadingScorecard] = useState(false);
  const [scorecardMessage, setScorecardMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [scorecardMetadataLocked, setScorecardMetadataLocked] = useState(false);

  // Load courses
  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses)
      .catch(() => {});
  }, []);

  // When course is selected in form, update selectedCourseId for tee dropdown
  useEffect(() => {
    if (editForm.course_id) setSelectedCourseId(editForm.course_id as string);
  }, [editForm.course_id]);

  // Get tees for selected course
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const availableTees = selectedCourse?.tees || [];

  // Handle tee selection - auto-populate WHS settings
  const handleTeeSelect = (teeId: string) => {
    const tee = availableTees.find((t) => t.id === teeId);
    if (tee) {
      setEditForm({
        ...editForm,
        selected_tee_id: teeId,
        slope_rating: tee.slope_rating,
        course_rating: tee.course_rating,
        course_par: tee.par,
        handicap_allowance: 0.95,
      });
    }
  };

  // Calculate playing handicap for WHS display
  const calcPlayingHC = (index: number) => {
    const slope = Number(editForm.slope_rating) || 113;
    const cr = Number(editForm.course_rating) || 72;
    const par = Number(editForm.course_par) || 72;
    const allowance = Number(editForm.handicap_allowance) || 0.95;
    // CORRECT: Apply allowance BEFORE rounding
    const courseHC = (index * slope) / 113 + (cr - par);
    return Math.round(courseHC * allowance);
  };

  const loadData = async () => {
    try {
      const r = await fetch(`/api/admin/events/${id}`);
      const d = await r.json();
      console.log("📊 Event data loaded:", {
        total_rsvps: d.rsvps?.length || 0,
        rsvp_names: d.rsvps?.map((r: any) => r.name).sort(),
        has_terry: d.rsvps?.some((r: any) => r.name === "Terry Creely"),
      });
      setData(d);
      // Ensure editForm and selectedCourseId are synced properly
      if (d.event) {
        setEditForm(d.event);
        if (d.event.course_id) {
          setSelectedCourseId(d.event.course_id);
        }
      }

      // Load prize configuration
      const prizeRes = await fetch(`/api/admin/prizes?event_id=${id}`);
      const prizeData = await prizeRes.json();
      if (prizeData.manual && prizeData.config) {
        setManualPrizes(true);
        setPrizeConfig(prizeData.config);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const loadResults = async () => {
    try {
      const r = await fetch(`/api/events/${id}/results`);
      const d = await r.json();
      setResults(d);
    } catch (error) {
      console.error("Error loading results:", error);
    }
  };

  useEffect(() => {
    if (isAuth) {
      loadData();
      // Load all members for "Not Responded" display
      fetch("/api/members")
        .then((r) => r.json())
        .then((members) => setAllMembers(members))
        .catch(() => {});
    }
  }, [isAuth, id]);

  useEffect(() => {
    if (tab === "results" && isAuth) {
      loadResults();
    }
  }, [tab, isAuth, id]);

  const savePrizeConfig = async () => {
    setSavingPrizes(true);
    try {
      const res = await fetch("/api/admin/prizes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: id, config: prizeConfig }),
      });
      if (res.ok) {
        alert("✅ Prize configuration saved!");
        setManualPrizes(true);
      } else {
        alert("❌ Failed to save prize configuration");
      }
    } catch (error) {
      console.error("Save prizes error:", error);
      alert("❌ Error saving prizes");
    }
    setSavingPrizes(false);
  };

  const revertToAutoPrizes = async () => {
    if (
      !confirm(
        "Revert to auto-calculation?\n\nThis will delete custom prize amounts and use automatic calculation based on payments.",
      )
    )
      return;

    setSavingPrizes(true);
    try {
      const res = await fetch(`/api/admin/prizes?event_id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("✅ Reverted to auto-calculation");
        setManualPrizes(false);
        setPrizeConfig({
          first: 80,
          second: 60,
          third: 40,
          front9: 25,
          back9: 25,
          twos: 0,
          visitor: 0,
        });
      } else {
        alert("❌ Failed to revert");
      }
    } catch (error) {
      console.error("Revert prizes error:", error);
      alert("❌ Error reverting");
    }
    setSavingPrizes(false);
  };

  const saveDetails = async () => {
    setSaving(true);
    try {
      const payload = { action: "update_details", ...editForm };
      console.log("Saving event details:", payload);
      const response = await fetch(`/api/admin/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      console.log("Save result:", result);
      if (!response.ok) {
        alert(`Error saving: ${result.error || "Unknown error"}`);
      } else {
        alert("✅ Event details saved successfully!");
      }
      loadData();
    } catch (err) {
      console.error("Save error:", err);
      alert("❌ Error saving event details");
    }
    setSaving(false);
  };

  const recalculateScores = async () => {
    if (
      !confirm(
        "🔄 Recalculate all scores with current H/C Allowance?\n\nThis will update playing handicaps and Stableford points for all scorecards.",
      )
    ) {
      return;
    }

    setRecalculating(true);
    try {
      const response = await fetch("/api/recalculate-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: id }),
      });
      const result = await response.json();

      if (!response.ok) {
        alert(`❌ Error: ${result.error || "Unknown error"}`);
      } else {
        alert(
          `✅ Recalculated ${result.recalculatedCount} scorecards!\nH/C Allowance: ${result.handicapAllowance}`,
        );
        loadData();
      }
    } catch (err) {
      console.error("Recalculate error:", err);
      alert("❌ Failed to recalculate scores");
    }
    setRecalculating(false);
  };

  const updateStatus = async (status: string) => {
    await fetch(`/api/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_status", status }),
    });
    loadData();
  };

  const handleOpenScoring = async () => {
    // Check for stale handicaps before opening scoring
    try {
      const res = await fetch(
        `/api/admin/check-stale-handicaps?eventId=${id}&days=30`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.count > 0) {
          // Show warning modal
          setStaleMembers(data.staleMembers);
          setShowStaleWarning(true);
          setPendingScoreOpen(true);
        } else {
          // No stale handicaps, proceed directly
          proceedToOpenScoring();
        }
      } else {
        // API failed, proceed anyway
        proceedToOpenScoring();
      }
    } catch (err) {
      console.error("Handicap check failed:", err);
      // If check fails, proceed anyway
      proceedToOpenScoring();
    }
  };

  const proceedToOpenScoring = () => {
    setEditForm({ ...editForm, scoring_open: 1 });
    setTimeout(saveDetails, 100);
    setShowStaleWarning(false);
    setPendingScoreOpen(false);
  };

  const cancelOpenScoring = () => {
    setShowStaleWarning(false);
    setPendingScoreOpen(false);
  };

  const generateTeeTimes = async () => {
    if (!data) return;
    const confirmed = data.rsvps.filter((r) => r.status === "confirmed");
    const shuffled = [...confirmed].sort(() => Math.random() - 0.5);
    const groups: Array<{
      group_number: number;
      tee_time: string;
      member_ids: string[];
    }> = [];
    let time =
      (editForm.first_tee as string) ||
      (data.event.first_tee as string) ||
      "09:30";
    const interval =
      (editForm.tee_interval as number) ||
      (data.event.tee_interval as number) ||
      8;

    for (let i = 0; i < shuffled.length; i += 4) {
      const group = shuffled.slice(i, i + 4);
      groups.push({
        group_number: groups.length + 1,
        tee_time: time,
        member_ids: group.map((m) => m.member_id),
      });
      const [h, m] = time.split(":").map(Number);
      const newMin = m + interval;
      time = `${String(h + Math.floor(newMin / 60)).padStart(2, "0")}:${String(newMin % 60).padStart(2, "0")}`;
    }

    await fetch("/api/tee-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: id, groups }),
    });
    loadData();
  };

  const loadScorecard = async () => {
    if (!editForm.course_name) {
      setScorecardMessage({
        type: "error",
        text: "Please select a course first",
      });
      return;
    }

    setLoadingScorecard(true);
    setScorecardMessage(null);

    try {
      // Check if course scorecard exists
      const checkRes = await fetch(
        `/api/course-scorecards?course=${encodeURIComponent(editForm.course_name as string)}`,
      );
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setScorecardMessage({
          type: "info",
          text: `No scorecard found for ${editForm.course_name}. Create one in Settings → Scorecards.`,
        });
        setLoadingScorecard(false);
        return;
      }

      // Load scorecard to event
      const loadRes = await fetch(`/api/events/${id}/load-scorecard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: editForm.course_name,
        }),
      });

      const loadResult = await loadRes.json();

      if (loadResult.success) {
        // Apply metadata if returned
        if (loadResult.metadata) {
          // Find the correct course based on course_name to ensure IDs match
          const correctCourse = courses.find(
            (c) => c.name === editForm.course_name,
          );

          // Get tees from the CORRECT course (not from old course_id)
          const correctTees = correctCourse?.tees || [];

          // Find matching tee by color from the correct course
          const matchingTee = correctTees.find(
            (t) =>
              t.tee_color.toLowerCase() ===
              loadResult.metadata.tee_color.toLowerCase(),
          );

          setEditForm({
            ...editForm,
            course_id: correctCourse?.id || editForm.course_id, // FIX: Update course_id to match course_name
            course_par: loadResult.totals.par,
            slope_rating: loadResult.metadata.slope_rating,
            course_rating: loadResult.metadata.course_rating,
            tee_color: loadResult.metadata.tee_color, // FIX: Set tee_color from Settings scorecard
            selected_tee_id: matchingTee?.id || editForm.selected_tee_id, // FIX: Use tee from correct course
          });

          // FIX: Sync dropdown to show correct course
          if (correctCourse) {
            setSelectedCourseId(correctCourse.id);
          }

          setScorecardMetadataLocked(true);
        }

        setScorecardMessage({
          type: "success",
          text: `✅ Loaded ${loadResult.totals.holes} holes! Par ${loadResult.totals.par}`,
        });
        // Force refresh event data to show loaded holes
        await loadData();
        // Clear message after 3 seconds
        setTimeout(() => setScorecardMessage(null), 3000);
      } else {
        setScorecardMessage({
          type: "error",
          text: loadResult.error || "Failed to load scorecard",
        });
      }
    } catch (error) {
      console.error("Error loading scorecard:", error);
      setScorecardMessage({ type: "error", text: "Error loading scorecard" });
    } finally {
      setLoadingScorecard(false);
    }
  };

  const saveNtp = async () => {
    if (!ntpMemberId || !ntpHole) return;
    await fetch("/api/side-comps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: id,
        type: "ntp",
        hole_number: ntpHole,
        member_id: ntpMemberId,
        value: 0,
        unit: "metres",
      }),
    });
    setNtpMemberId("");
    setNtpSearch("");
    loadData();
  };
  const saveLd = async () => {
    if (!ldMemberId || !ldHole) return;
    await fetch("/api/side-comps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: id,
        type: "longest_drive",
        hole_number: ldHole,
        member_id: ldMemberId,
        value: 0,
        unit: "metres",
      }),
    });
    setLdMemberId("");
    setLdSearch("");
    setLdHole(0);
    loadData();
  };
  const saveTwos = async () => {
    if (!twosMemberId || !twosHole) return;
    await fetch("/api/side-comps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: id,
        type: "twos",
        hole_number: twosHole,
        member_id: twosMemberId,
        value: 2,
        unit: "strokes",
      }),
    });
    setTwosMemberId("");
    setTwosSearch("");
    setTwosHole(0);
    loadData();
  };

  const saveVisitorPrize = async () => {
    if (!visitorName || !visitorHandicap || !visitorPoints) return;
    await fetch("/api/side-comps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: id,
        type: "visitors",
        hole_number: 0,
        visitor_name: visitorName,
        visitor_handicap: parseFloat(visitorHandicap) || 0,
        visitor_points: parseInt(visitorPoints) || 0,
        value: 0,
        unit: "points",
      }),
    });
    setVisitorName("");
    setVisitorHandicap("");
    setVisitorPoints("");
    loadData();
  };
  const saveSideComp = async () => {
    if (!sideCompForm.member_id || !sideCompForm.value) return;
    await fetch("/api/side-comps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: id, ...sideCompForm }),
    });
    setSideCompForm({ ...sideCompForm, member_id: "", value: 0 });
    setSidePlayerSearch("");
    loadData();
  };

  const finaliseResults = async () => {
    if (
      !confirm(
        "Finalize results for admin preview?\n\nThis will calculate prizes and update GOTY standings, but members will NOT see results until you publish from Admin → Publish tab.",
      )
    )
      return;
    await fetch("/api/finalise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: id }),
    });
    await updateStatus("finalised");
    loadData();
    // Auto-refresh after 2 seconds to show fresh results
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  // Move player to different group
  const movePlayerToGroup = async (targetGroupNumber: number) => {
    if (!movingPlayer || !data) return;
    setSavingTeeTimes(true);

    // Build updated groups
    const updatedGroups = data.teeTimes.map((tt) => {
      let memberIds = tt.members.map((m) => m.id);

      // Remove player from their current group
      if (tt.group_number === movingPlayer.fromGroup) {
        memberIds = memberIds.filter((id) => id !== movingPlayer.memberId);
      }

      // Add player to target group
      if (tt.group_number === targetGroupNumber) {
        memberIds.push(movingPlayer.memberId);
      }

      return {
        group_number: tt.group_number,
        tee_time: tt.tee_time,
        member_ids: memberIds,
      };
    });

    await fetch("/api/tee-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: id, groups: updatedGroups }),
    });

    setMovingPlayer(null);
    setSavingTeeTimes(false);
    loadData();
  };

  // Update tee time for a group
  const updateTeeTime = async () => {
    if (!editingTime || !data) return;
    setSavingTeeTimes(true);

    const updatedGroups = data.teeTimes.map((tt) => ({
      group_number: tt.group_number,
      tee_time: tt.id === editingTime.groupId ? editingTime.time : tt.tee_time,
      member_ids: tt.members.map((m) => m.id),
    }));

    await fetch("/api/tee-times", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: id, groups: updatedGroups }),
    });

    setEditingTime(null);
    setSavingTeeTimes(false);
    loadData();
  };

  // Mark player as DNS (Did Not Show)
  const markDns = async (teeTimeId: string) => {
    if (!dnsModal) return;
    setMarkingDns(true);
    try {
      const res = await fetch(`/api/tee-times/${teeTimeId}/mark-dns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: dnsModal.memberId,
          reason: dnsReason,
          markedBy: "admin",
        }),
      });
      if (res.ok) {
        await loadData();
        setDnsModal(null);
        setDnsReason("Withdrew");
      } else {
        const error = await res.json();
        alert("Failed to mark DNS: " + error.details);
      }
    } catch (err) {
      console.error("DNS mark failed:", err);
      alert("Failed to mark player as DNS");
    }
    setMarkingDns(false);
  };

  // Remove player from event
  const removePlayerFromEvent = async (rsvpId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this competition?`)) return;
    setRemovingPlayer(rsvpId);

    await fetch("/api/rsvps", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rsvp_id: rsvpId, event_id: id }),
    });

    setRemovingPlayer(null);
    loadData();
  };

  // Open score entry for a player
  const openScoreEntry = async (player: {
    member_id: string;
    name: string;
    handicap: number;
  }) => {
    setScoreEntryPlayer(player);
    setHoleScores(Array(18).fill(0));

    // Try to load existing scores
    try {
      const res = await fetch(
        `/api/scorecards?event_id=${id}&member_id=${player.member_id}`,
      );
      const existing = await res.json();
      if (existing.scores && existing.scores.length > 0) {
        const scores = Array(18).fill(0);
        existing.scores.forEach(
          (s: { hole_number: number; gross_score: number }) => {
            scores[s.hole_number - 1] = s.gross_score;
          },
        );
        setHoleScores(scores);
      }
    } catch (e) {
      console.error("Failed to load existing scores", e);
    }
  };

  // Save scores for selected player
  const saveScores = async () => {
    if (!scoreEntryPlayer || !data) return;
    setSavingScores(true);

    try {
      await fetch("/api/scorecards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: id,
          member_id: scoreEntryPlayer.member_id,
          holes: data.holes,
          handicap: scoreEntryPlayer.handicap,
          scores: holeScores.map((gross_score, i) => ({
            hole_number: i + 1,
            gross_score,
            par: data.holes[i]?.par || 4,
            stroke_index: data.holes[i]?.stroke_index || i + 1,
          })),
          submit: true,
        }),
      });
      setScoreEntryPlayer(null);
      loadData();
    } catch (e) {
      console.error("Failed to save scores", e);
      alert("Failed to save scores");
    }
    setSavingScores(false);
  };

  // Quick handicap update
  const openHandicapEdit = (player: {
    member_id: string;
    name: string;
    handicap: number;
  }) => {
    setEditingHandicap({
      member_id: player.member_id,
      name: player.name,
      current_handicap: player.handicap,
    });
    setNewHandicap(player.handicap.toString());
  };

  const saveHandicap = async () => {
    if (!editingHandicap) return;
    const value = parseFloat(newHandicap);
    if (isNaN(value) || value < 0 || value > 54) {
      alert("Please enter a valid handicap between 0 and 54");
      return;
    }

    const change = Math.abs(value - editingHandicap.current_handicap);
    if (change > 2) {
      if (
        !confirm(
          `Large change detected: ${editingHandicap.current_handicap} → ${value} (${change.toFixed(1)} shots)\n\nContinue?`,
        )
      ) {
        return;
      }
    }

    setSavingHandicap(true);
    try {
      // Update member's handicap (single source of truth)
      await fetch("/api/members/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingHandicap.member_id, // API expects 'id' not 'member_id'
          handicap: value,
        }),
      });

      // Log the change for audit trail
      await fetch("/api/member/update-handicap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: editingHandicap.member_id,
          new_handicap: value,
          update_method: "admin_quick_edit",
        }),
      });

      setEditingHandicap(null);
      loadData(); // Refresh to show new handicap
    } catch (e) {
      console.error("Failed to update handicap", e);
      alert("Failed to update handicap");
    }
    setSavingHandicap(false);
  };

  if (checking || !isAuth) return null;

  const evt = data?.event;
  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "details", label: "📝 Details" },
    { key: "players", label: "👥 Players" },
    { key: "teetimes", label: "⏰ Tee Times" },
    { key: "payments", label: "💶 Payments" },
    { key: "prizes", label: "💰 Prizes" },
    { key: "scorecards", label: "📋 Scorecards" },
    { key: "sidecomps", label: "🎯 Side Comps" },
    { key: "results", label: "🏆 Results" },
  ];

  // Get all confirmed players for score entry
  const confirmedPlayers =
    data?.rsvps.filter((r) => r.status === "confirmed") || [];
  const playersWithScores = new Set(
    data?.scorecards.map((sc) => sc.member_id) || [],
  );

  return (
    <div>
      <AdminHeader title={(evt?.name as string) || "Event"} onLock={logout} />
      <div className="max-w-4xl mx-auto px-4 pt-3">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1 text-sm text-fairway-800 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white border-b border-gray-200 overflow-x-auto hide-scrollbar">
        <div className="flex px-2 py-2 gap-1 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                tab === t.key
                  ? "bg-fairway-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Score Entry Modal */}
      {scoreEntryPlayer &&
        data &&
        (() => {
          // WHS Playing Handicap Calculation
          // CORRECT FORMULA: Playing H/C = ROUND(((Index × Slope ÷ 113) + (CR − Par)) × Allowance)
          // Apply allowance BEFORE rounding!
          const slope = (data.event.slope_rating as number) || 113;
          const courseRating = (data.event.course_rating as number) || 72;
          const coursePar = (data.event.course_par as number) || 72;
          const allowance = (data.event.handicap_allowance as number) || 0.95;

          // Calculate course HC without rounding, apply allowance, then round
          const courseHC =
            (scoreEntryPlayer.handicap * slope) / 113 +
            (courseRating - coursePar);
          const playingHC = Math.round(courseHC * allowance);

          // Calculate stableford points for each hole using WHS playing handicap
          const calcPoints = (gross: number, par: number, si: number) => {
            if (!gross || gross === 0) return null;
            let strokesReceived = 0;
            if (playingHC >= si) strokesReceived++;
            if (playingHC >= si + 18) strokesReceived++;
            const net = gross - strokesReceived;
            return Math.max(0, 2 - (net - par));
          };

          const holePoints = data.holes.map((hole, i) =>
            calcPoints(holeScores[i], hole.par, hole.stroke_index),
          );
          const totalPoints = holePoints.reduce(
            (sum: number, p) => sum + (p || 0),
            0,
          );
          const totalStrokes = holeScores.reduce((a, b) => a + b, 0);

          return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10">
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {scoreEntryPlayer.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Index: {scoreEntryPlayer.handicap} → Playing: {playingHC}
                    </p>
                  </div>
                  <button
                    onClick={() => setScoreEntryPlayer(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    &times;
                  </button>
                </div>

                <div className="p-4">
                  {/* Header row */}
                  <div className="grid grid-cols-6 gap-1 mb-2 text-[10px] font-bold text-gray-500 text-center">
                    <span>Hole</span>
                    <span>Par</span>
                    <span>SI</span>
                    <span>Strokes</span>
                    <span>Pts</span>
                    <span></span>
                  </div>

                  {/* Front 9 */}
                  <div className="space-y-1 mb-2">
                    {data.holes.slice(0, 9).map((hole, i) => {
                      const pts = holePoints[i];
                      return (
                        <div
                          key={hole.hole_number}
                          className="grid grid-cols-6 gap-1 items-center bg-gray-50 rounded-lg p-1.5"
                        >
                          <span className="text-xs font-bold text-center text-gray-700">
                            {hole.hole_number}
                          </span>
                          <span className="text-xs text-center text-gray-500">
                            {hole.par}
                          </span>
                          <span className="text-xs text-center text-amber-600 font-medium">
                            {hole.stroke_index}
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="15"
                            value={holeScores[i] || ""}
                            onChange={(e) => {
                              const newScores = [...holeScores];
                              newScores[i] = parseInt(e.target.value) || 0;
                              setHoleScores(newScores);
                            }}
                            className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm font-bold focus:border-fairway-800 focus:outline-none"
                            placeholder="-"
                          />
                          <span
                            className={`text-sm font-bold text-center ${pts === null ? "text-gray-300" : pts >= 2 ? "text-green-600" : pts === 1 ? "text-amber-600" : "text-red-500"}`}
                          >
                            {pts !== null ? pts : "-"}
                          </span>
                          <span></span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Front 9 subtotal */}
                  <div className="bg-fairway-100 rounded-lg p-2 mb-3 grid grid-cols-6 gap-1 text-xs font-bold">
                    <span className="text-center text-fairway-800">OUT</span>
                    <span className="text-center text-gray-500">
                      {data.holes.slice(0, 9).reduce((s, h) => s + h.par, 0)}
                    </span>
                    <span></span>
                    <span className="text-center text-fairway-900">
                      {holeScores.slice(0, 9).reduce((a, b) => a + b, 0) || "-"}
                    </span>
                    <span className="text-center text-fairway-900">
                      {holePoints
                        .slice(0, 9)
                        .reduce((s: number, p) => s + (p || 0), 0)}
                    </span>
                    <span></span>
                  </div>

                  {/* Back 9 */}
                  <div className="space-y-1 mb-2">
                    {data.holes.slice(9, 18).map((hole, idx) => {
                      const i = idx + 9;
                      const pts = holePoints[i];
                      return (
                        <div
                          key={hole.hole_number}
                          className="grid grid-cols-6 gap-1 items-center bg-gray-50 rounded-lg p-1.5"
                        >
                          <span className="text-xs font-bold text-center text-gray-700">
                            {hole.hole_number}
                          </span>
                          <span className="text-xs text-center text-gray-500">
                            {hole.par}
                          </span>
                          <span className="text-xs text-center text-amber-600 font-medium">
                            {hole.stroke_index}
                          </span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="15"
                            value={holeScores[i] || ""}
                            onChange={(e) => {
                              const newScores = [...holeScores];
                              newScores[i] = parseInt(e.target.value) || 0;
                              setHoleScores(newScores);
                            }}
                            className="w-full border border-gray-200 rounded px-1 py-1 text-center text-sm font-bold focus:border-fairway-800 focus:outline-none"
                            placeholder="-"
                          />
                          <span
                            className={`text-sm font-bold text-center ${pts === null ? "text-gray-300" : pts >= 2 ? "text-green-600" : pts === 1 ? "text-amber-600" : "text-red-500"}`}
                          >
                            {pts !== null ? pts : "-"}
                          </span>
                          <span></span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Back 9 subtotal */}
                  <div className="bg-fairway-100 rounded-lg p-2 mb-3 grid grid-cols-6 gap-1 text-xs font-bold">
                    <span className="text-center text-fairway-800">IN</span>
                    <span className="text-center text-gray-500">
                      {data.holes.slice(9, 18).reduce((s, h) => s + h.par, 0)}
                    </span>
                    <span></span>
                    <span className="text-center text-fairway-900">
                      {holeScores.slice(9, 18).reduce((a, b) => a + b, 0) ||
                        "-"}
                    </span>
                    <span className="text-center text-fairway-900">
                      {holePoints
                        .slice(9, 18)
                        .reduce((s: number, p) => s + (p || 0), 0)}
                    </span>
                    <span></span>
                  </div>

                  {/* Totals */}
                  <div className="bg-fairway-900 text-white rounded-xl p-3 mb-4 grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-xs text-fairway-200">Total Strokes</p>
                      <p className="text-2xl font-bold">
                        {totalStrokes || "-"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-fairway-200">
                        Stableford Points
                      </p>
                      <p className="text-2xl font-bold">{totalPoints}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setScoreEntryPlayer(null)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveScores}
                      disabled={savingScores}
                      className="flex-1 bg-fairway-900 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                    >
                      {savingScores ? "Saving..." : "✓ Save Scores"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
        ) : !data ? (
          <p className="text-gray-500">Event not found</p>
        ) : (
          <>
            {/* DETAILS TAB */}
            {tab === "details" && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4">
                    Event Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: "Event Name", key: "name", type: "text" },
                      { label: "Course", key: "course_name", type: "text" },
                      { label: "Location", key: "location", type: "text" },
                      { label: "Date", key: "date", type: "date" },
                      { label: "First Tee", key: "first_tee", type: "time" },
                      {
                        label: "Entry Fee (€)",
                        key: "entry_fee",
                        type: "number",
                      },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="text-sm font-medium text-gray-700 block mb-1">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          value={(editForm[field.key] as string) || ""}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              [field.key]:
                                field.type === "number"
                                  ? Number(e.target.value)
                                  : e.target.value,
                            })
                          }
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Format
                      </label>
                      <select
                        value={(editForm.format as string) || "Stableford"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, format: e.target.value })
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                      >
                        {[
                          "Stableford",
                          "Strokeplay",
                          "Best Ball",
                          "Scramble",
                          "Matchplay",
                          "Team Event",
                        ].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Status
                      </label>
                      <select
                        value={(editForm.status as string) || "upcoming"}
                        onChange={(e) =>
                          setEditForm({ ...editForm, status: e.target.value })
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="upcoming">📅 Upcoming</option>
                        <option value="in_progress">⏱️ In Progress</option>
                        <option value="finalised">✅ Finalised</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Scoring
                      </label>
                      <select
                        value={(editForm.scoring_open as number) || 0}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            scoring_open: Number(e.target.value),
                          })
                        }
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
                      >
                        <option value="0">🔒 Closed</option>
                        <option value="1">⛳ Open</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <button
                      onClick={saveDetails}
                      disabled={saving}
                      className="bg-fairway-900 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    {(editForm.status as string) === "upcoming" && (
                      <button
                        onClick={() => updateStatus("in_progress")}
                        className="bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-green-700"
                      >
                        ▶️ Start Event Now
                      </button>
                    )}
                    {!(editForm.scoring_open as number) && (
                      <button
                        onClick={handleOpenScoring}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700"
                      >
                        ⛳ Open Scoring
                      </button>
                    )}
                    {data?.scorecards && data.scorecards.length > 0 && (
                      <button
                        onClick={recalculateScores}
                        disabled={recalculating}
                        className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                      >
                        {recalculating
                          ? "🔄 Recalculating..."
                          : "🔄 Recalculate Scores"}
                      </button>
                    )}
                  </div>
                </div>

                {/* WHS Course Settings */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2">
                    ⛳ WHS Course Settings
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Select course and tee to auto-calculate playing handicaps
                  </p>

                  {/* Course & Tee Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Golf Course{" "}
                        {scorecardMetadataLocked && (
                          <span className="text-xs text-fairway-600">
                            🔒 Locked
                          </span>
                        )}
                      </label>
                      {scorecardMetadataLocked ? (
                        <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium">
                          {courses.find(
                            (c) =>
                              c.id ===
                              (editForm.course_id || data?.event?.course_id),
                          )?.name ||
                            editForm.course_name ||
                            data?.event?.course_name ||
                            "Not set"}
                        </div>
                      ) : (
                        <select
                          value={selectedCourseId}
                          onChange={(e) => {
                            setSelectedCourseId(e.target.value);
                            setEditForm({
                              ...editForm,
                              course_id: e.target.value,
                              course_name: courses.find(
                                (c) => c.id === e.target.value,
                              )?.name,
                              selected_tee_id: "",
                            });
                          }}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none"
                        >
                          <option value="">-- Select Course --</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {scorecardMetadataLocked
                          ? "From scorecard settings"
                          : "Select 18-hole combination for 27-hole courses"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Tee Colour 🔒
                      </label>
                      <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium">
                        {editForm.tee_color ||
                          data?.event?.tee_color ||
                          "Not set"}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Auto-filled from scorecard
                      </p>
                    </div>
                  </div>

                  {/* WHS Values (from scorecard) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Slope Rating 🔒
                      </label>
                      <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium">
                        {(editForm.slope_rating as number) ||
                          evt?.slope_rating ||
                          "Not set"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Course Rating 🔒
                      </label>
                      <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium">
                        {(editForm.course_rating as number) ||
                          evt?.course_rating ||
                          "Not set"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Course Par 🔒
                      </label>
                      <div className="w-full border border-gray-200 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-700 font-medium">
                        {(editForm.course_par as number) ||
                          evt?.course_par ||
                          "Not set"}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        H/C Allowance % ✅
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        value={
                          editForm.handicap_allowance !== undefined &&
                          editForm.handicap_allowance !== null
                            ? Math.round(
                                (editForm.handicap_allowance as number) * 100,
                              )
                            : 95
                        }
                        onKeyDown={(e) => {
                          // Prevent leading zeros
                          if (e.key === "0" && e.currentTarget.value === "")
                            e.preventDefault();
                        }}
                        onChange={(e) => {
                          let val = e.target.value.replace(/^0+/, "") || "0"; // Remove leading zeros
                          const numVal =
                            val === ""
                              ? 0
                              : Math.min(100, Math.max(0, Number(val)));
                          setEditForm({
                            ...editForm,
                            handicap_allowance: numVal / 100,
                          });
                        }}
                        onBlur={(e) => {
                          // Clean up on blur - ensure proper format
                          const numVal = Math.min(
                            100,
                            Math.max(0, Number(e.target.value) || 0),
                          );
                          setEditForm({
                            ...editForm,
                            handicap_allowance: numVal / 100,
                          });
                        }}
                        className="w-full border border-fairway-600 rounded-xl px-3 py-2.5 text-sm font-medium focus:border-fairway-800 focus:outline-none focus:ring-2 focus:ring-fairway-200"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-4">
                    Playing H/C = ROUND((Index × Slope ÷ 113) + (CR − Par)) ×
                    Allowance
                  </p>

                  {/* Playing Handicaps Preview */}
                  {data &&
                    data.rsvps.filter((r) => r.status === "confirmed").length >
                      0 &&
                    (editForm.slope_rating as number) > 0 && (
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">
                          📋 Playing Handicaps Preview
                        </h4>
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left px-2 py-1 font-medium text-gray-600">
                                  Player
                                </th>
                                <th className="text-right px-2 py-1 font-medium text-gray-600">
                                  Index
                                </th>
                                <th className="text-right px-2 py-1 font-medium text-gray-600">
                                  Playing HC
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.rsvps
                                .filter((r) => r.status === "confirmed")
                                .sort((a, b) => {
                                  const sA = (a.name || "")
                                    .trim()
                                    .split(" ")
                                    .slice(-1)[0];
                                  const sB = (b.name || "")
                                    .trim()
                                    .split(" ")
                                    .slice(-1)[0];
                                  return sA.localeCompare(sB);
                                })
                                .map((player) => (
                                  <tr
                                    key={player.member_id}
                                    className="border-t border-gray-50"
                                  >
                                    <td className="px-2 py-1">{player.name}</td>
                                    <td className="px-2 py-1 text-right text-gray-500">
                                      {player.handicap}
                                    </td>
                                    <td className="px-2 py-1 text-right font-bold text-fairway-800">
                                      {calcPlayingHC(player.handicap)}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>

                {/* Course Holes Management */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2">
                    ⛳ Course Holes Management
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Load the 18-hole scorecard for this course and tee
                    combination
                  </p>

                  {/* Load Scorecard Button */}
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={loadScorecard}
                      disabled={
                        !selectedCourseId ||
                        loadingScorecard ||
                        scorecardMetadataLocked
                      }
                      className="bg-fairway-800 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-fairway-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {loadingScorecard ? (
                        <>
                          <span className="inline-block animate-spin">⏳</span>
                          Loading...
                        </>
                      ) : (
                        <>📋 Load Scorecard from Master</>
                      )}
                    </button>
                    {!selectedCourseId && !scorecardMetadataLocked && (
                      <p className="text-xs text-gray-400">
                        ℹ️ Select course first
                      </p>
                    )}
                  </div>

                  {/* Scorecard Status Message (hide if holes already loaded) */}
                  {scorecardMessage &&
                    !(data && data.holes && data.holes.length > 0) && (
                      <div
                        className={`p-3 rounded-xl text-sm mb-4 ${
                          scorecardMessage.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : scorecardMessage.type === "error"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {scorecardMessage.text}
                      </div>
                    )}

                  {/* Current Holes Status */}
                  {data && data.holes && data.holes.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-700">
                          ✅ Course Holes Loaded
                        </h4>
                        <span className="text-xs text-gray-500">
                          {data.holes.length} holes • Par{" "}
                          {data.holes.reduce((sum, h) => sum + h.par, 0)} •{" "}
                          {data.holes.reduce((sum, h) => sum + h.yardage, 0)}{" "}
                          yards
                        </span>
                      </div>
                      <div className="grid grid-cols-9 gap-1 text-xs">
                        {data.holes.slice(0, 9).map((h) => (
                          <div
                            key={h.hole_number}
                            className="bg-gray-50 p-1.5 rounded text-center"
                          >
                            <div className="font-bold text-fairway-800 text-sm">
                              {h.hole_number}
                            </div>
                            <div className="text-gray-600">Par {h.par}</div>
                            <div className="text-gray-400 text-[10px]">
                              SI {h.stroke_index}
                            </div>
                            <div className="text-gray-400 text-[10px]">
                              {h.yardage}y
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-9 gap-1 text-xs mt-1">
                        {data.holes.slice(9, 18).map((h) => (
                          <div
                            key={h.hole_number}
                            className="bg-gray-50 p-1.5 rounded text-center"
                          >
                            <div className="font-bold text-fairway-800 text-sm">
                              {h.hole_number}
                            </div>
                            <div className="text-gray-600">Par {h.par}</div>
                            <div className="text-gray-400 text-[10px]">
                              SI {h.stroke_index}
                            </div>
                            <div className="text-gray-400 text-[10px]">
                              {h.yardage}y
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Holes Warning */}
                  {data && (!data.holes || data.holes.length === 0) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                      ⚠️ No course holes configured yet. Load from master or
                      enter manually.
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3">Event Status</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Current:{" "}
                    <span className="font-bold uppercase">
                      {evt?.status as string}
                    </span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {["upcoming", "in_progress", "finalised"].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(s)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium ${
                          evt?.status === s
                            ? "bg-fairway-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Type & Classes */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2">
                    🏆 Competition Type
                  </h3>

                  <div className="flex gap-2 mb-4">
                    {["standard", "captains", "presidents"].map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          setEditForm({ ...editForm, event_type: t })
                        }
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          (editForm.event_type || "standard") === t
                            ? "bg-fairway-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {t === "standard"
                          ? "⛳ Standard"
                          : t === "captains"
                            ? "🎖️ Captain's Prize"
                            : "🏅 President's Prize"}
                      </button>
                    ))}
                  </div>

                  {/* Class settings for Captain's/President's */}
                  {(editForm.event_type === "captains" ||
                    editForm.event_type === "presidents") && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <p className="text-sm text-amber-800 mb-3">
                        Set handicap ranges for Class 1 and Class 2
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Class 1 Max Handicap
                          </label>
                          <input
                            type="number"
                            value={
                              (editForm.class1_max_handicap as number) || 18
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                class1_max_handicap: Number(e.target.value),
                              })
                            }
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Playing handicap ≤ this value
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 block mb-1">
                            Class 2 Min Handicap
                          </label>
                          <input
                            type="number"
                            value={
                              (editForm.class2_min_handicap as number) || 19
                            }
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                class2_min_handicap: Number(e.target.value),
                              })
                            }
                            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Playing handicap &gt; this value
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Club Contact & Notes */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-2">
                    📞 Club Contact & Notes
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={(editForm.club_contact_name as string) || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            club_contact_name: e.target.value,
                          })
                        }
                        placeholder="e.g., Darragh Tighe"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={(editForm.club_contact_phone as string) || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            club_contact_phone: e.target.value,
                          })
                        }
                        placeholder="01 xxx xxxx"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={(editForm.club_contact_email as string) || ""}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            club_contact_email: e.target.value,
                          })
                        }
                        placeholder="pro@golfclub.ie"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Notes
                    </label>
                    <textarea
                      value={(editForm.booking_notes as string) || ""}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          booking_notes: e.target.value,
                        })
                      }
                      placeholder="Notes about calls, conversations, bookings, deposits, special arrangements..."
                      rows={4}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-fairway-800 focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={saveDetails}
                      disabled={saving}
                      className="bg-fairway-900 text-white px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PLAYERS TAB */}
            {tab === "players" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Players & RSVPs</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        const res = await fetch(
                          "/api/admin/validate-event-data",
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ event_id: id }),
                          },
                        );
                        const result = await res.json();
                        if (result.healthy) {
                          alert(
                            "✅ Data Health Check: All Good!\n\n" +
                              `RSVPs: ${result.summary.rsvps}\n` +
                              `Scorecards: ${result.summary.scorecards}\n` +
                              `Tee Times: ${result.summary.tee_times}`,
                          );
                        } else {
                          const msg = [];
                          if (result.issues?.length)
                            msg.push("ISSUES:\n" + result.issues.join("\n"));
                          if (result.warnings?.length)
                            msg.push(
                              "WARNINGS:\n" + result.warnings.join("\n"),
                            );
                          alert("⚠️ Data Health Check\n\n" + msg.join("\n\n"));
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                    >
                      🩺 Health Check
                    </button>
                    <button
                      onClick={async () => {
                        if (
                          !confirm(
                            "Sync Event Data?\n\nThis will:\n• Create missing RSVPs for tee time players\n• Create missing scorecards\n• Fix data inconsistencies",
                          )
                        )
                          return;
                        const res = await fetch("/api/admin/sync-event-data", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ event_id: id }),
                        });
                        const result = await res.json();
                        if (result.success) {
                          alert(
                            `✅ Sync complete!\n\n${result.details.join("\n")}`,
                          );
                          loadData();
                        } else {
                          alert(`❌ Error: ${result.error}`);
                        }
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition"
                    >
                      🔄 Sync Event Data
                    </button>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      ✅{" "}
                      {
                        data.rsvps.filter((r) => r.status === "confirmed")
                          .length
                      }
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      🤔 {data.rsvps.filter((r) => r.status === "maybe").length}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      ❌{" "}
                      {data.rsvps.filter((r) => r.status === "declined").length}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Tap ✕ to remove a player who cancels
                </p>
                {/* Not responded section */}
                {(() => {
                  const rsvpMemberIds = new Set(
                    data.rsvps.map((r) => r.member_id),
                  );
                  const notResponded = allMembers.filter(
                    (m) => !rsvpMemberIds.has(m.id),
                  );
                  if (notResponded.length === 0) return null;
                  return (
                    <div className="bg-orange-50 rounded-2xl p-4 mb-4 border border-orange-200">
                      <h4 className="text-sm font-bold text-orange-800 mb-2">
                        ⚠️ Not Responded ({notResponded.length})
                      </h4>
                      <p className="text-xs text-orange-600 mb-3">
                        👆 Tap any name to quickly add them as confirmed RSVP
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {notResponded
                          .sort((a, b) =>
                            a.name
                              .trim()
                              .split(" ")
                              .slice(-1)[0]
                              .localeCompare(
                                b.name.trim().split(" ").slice(-1)[0],
                              ),
                          )
                          .map((m) => (
                            <button
                              key={m.id}
                              onClick={async () => {
                                if (
                                  !confirm(`Add ${m.name} as confirmed RSVP?`)
                                )
                                  return;
                                try {
                                  const res = await fetch("/api/rsvps", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      event_id: id,
                                      member_id: m.id,
                                      status: "confirmed",
                                      created_by: "admin",
                                    }),
                                  });
                                  if (res.ok) {
                                    alert(`✅ ${m.name} added to RSVPs!`);
                                    loadData();
                                  } else {
                                    alert("❌ Failed to add RSVP");
                                  }
                                } catch (error) {
                                  alert("❌ Error adding RSVP");
                                }
                              }}
                              className="text-xs bg-white px-2 py-1 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300 cursor-pointer transition-colors"
                            >
                              {m.name.trim()}
                            </button>
                          ))}
                      </div>
                    </div>
                  );
                })()}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {data.rsvps.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400">No RSVPs yet</p>
                  ) : (
                    [...data.rsvps]
                      .sort((a, b) => {
                        const sA = (a.name || "")
                          .trim()
                          .split(" ")
                          .slice(-1)[0];
                        const sB = (b.name || "")
                          .trim()
                          .split(" ")
                          .slice(-1)[0];
                        return sA.localeCompare(sB);
                      })
                      .map((r, i) => (
                        <div
                          key={r.id}
                          className={`flex items-center px-4 py-3 ${i > 0 ? "border-t border-gray-50" : ""}`}
                        >
                          <span className="w-6 text-center">
                            {r.status === "confirmed"
                              ? "✅"
                              : r.status === "maybe"
                                ? "🤔"
                                : "❌"}
                          </span>
                          <div className="flex-1 ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {r.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              Hcp {r.handicap}{" "}
                              {r.member_type === "visitor" ? "(Visitor)" : ""}
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              const newVal = r.can_enter_scores ? 0 : 1;
                              await fetch("/api/rsvps", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  rsvp_id: r.id,
                                  can_enter_scores: newVal,
                                }),
                              });
                              loadData();
                            }}
                            className={`ml-2 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              r.can_enter_scores
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                            title={
                              r.can_enter_scores
                                ? "Can enter scores - click to disable"
                                : "Cannot enter scores - click to enable"
                            }
                          >
                            {r.can_enter_scores ? "✏️ Yes" : "🚫 No"}
                          </button>
                          <button
                            onClick={() => removePlayerFromEvent(r.id, r.name)}
                            disabled={removingPlayer === r.id}
                            className="ml-2 w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                            title="Remove from competition"
                          >
                            {removingPlayer === r.id ? "..." : "✕"}
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {/* TEE TIMES TAB */}
            {tab === "teetimes" && (
              <div>
                {/* Tee Time Settings */}
                <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        First Tee:
                      </label>
                      <input
                        type="time"
                        value={(editForm.first_tee as string) || "09:30"}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            first_tee: e.target.value,
                          })
                        }
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Interval:
                      </label>
                      <select
                        value={(editForm.tee_interval as number) || 8}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            tee_interval: Number(e.target.value),
                          })
                        }
                        className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                      >
                        <option value={8}>8 min</option>
                        <option value={10}>10 min</option>
                        <option value={12}>12 min</option>
                        <option value={15}>15 min</option>
                      </select>
                    </div>
                    <button
                      onClick={saveDetails}
                      disabled={saving}
                      className="text-xs bg-fairway-800 text-white px-3 py-1.5 rounded-lg"
                    >
                      Save
                    </button>
                  </div>

                  {/* Quick Generate Slots */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Quick create:</span>
                    {[4, 6, 8, 10, 12].map((n) => (
                      <button
                        key={n}
                        onClick={async () => {
                          const interval =
                            (editForm.tee_interval as number) || 8;
                          const firstTee =
                            (editForm.first_tee as string) || "09:30";
                          const [h, m] = firstTee.split(":").map(Number);

                          const groups = [];
                          for (let i = 1; i <= n; i++) {
                            const totalMins = h * 60 + m + (i - 1) * interval;
                            const newH = Math.floor(totalMins / 60) % 24;
                            const newM = totalMins % 60;
                            const time = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
                            groups.push({
                              group_number: i,
                              tee_time: time,
                              member_ids: [],
                            });
                          }

                          setSavingTeeTimes(true);
                          await fetch("/api/tee-times", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ event_id: id, groups }),
                          });
                          loadData();
                          setSavingTeeTimes(false);
                        }}
                        disabled={savingTeeTimes}
                        className="px-3 py-1 bg-gray-100 hover:bg-fairway-100 text-gray-700 hover:text-fairway-900 rounded-lg text-sm font-medium transition-colors"
                      >
                        {n} slots
                      </button>
                    ))}
                    <button
                      onClick={async () => {
                        if (!confirm("Clear all tee times?")) return;
                        setSavingTeeTimes(true);
                        await fetch("/api/tee-times", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ event_id: id, groups: [] }),
                        });
                        loadData();
                        setSavingTeeTimes(false);
                      }}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors ml-2"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={async () => {
                        if (!data || data.teeTimes.length === 0) return;
                        if (
                          !confirm(
                            "Recalculate all tee times from " +
                              ((editForm.first_tee as string) || "09:30") +
                              "?",
                          )
                        )
                          return;
                        setSavingTeeTimes(true);
                        const interval = (editForm.tee_interval as number) || 8;
                        const firstTee =
                          (editForm.first_tee as string) || "09:30";
                        const [h, m] = firstTee.split(":").map(Number);
                        const updatedGroups = data.teeTimes.map((tt, idx) => {
                          const totalMins = h * 60 + m + idx * interval;
                          const newH = Math.floor(totalMins / 60) % 24;
                          const newM = totalMins % 60;
                          const time = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
                          return {
                            group_number: tt.group_number,
                            tee_time: time,
                            member_ids: tt.members.map(
                              (p: { id: string }) => p.id,
                            ),
                          };
                        });
                        await fetch("/api/tee-times", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            event_id: id,
                            groups: updatedGroups,
                          }),
                        });
                        loadData();
                        setSavingTeeTimes(false);
                      }}
                      disabled={savingTeeTimes}
                      className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔄 Recalculate Times
                    </button>
                    <Link
                      href={`/admin/event/${id}/print-scorecards`}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 ml-auto"
                    >
                      🖨️ Print
                    </Link>
                  </div>
                </div>

                {/* Two-column drag-and-drop tee sheet */}
                {data &&
                  (() => {
                    const assignedIds = new Set(
                      data.teeTimes.flatMap((tt) =>
                        tt.members.map((m: { id: string }) => m.id),
                      ),
                    );
                    const unassigned = data.rsvps.filter(
                      (r) =>
                        r.status === "confirmed" &&
                        !assignedIds.has(r.member_id),
                    );
                    const interval = (editForm.tee_interval as number) || 8;
                    const firstTee = (editForm.first_tee as string) || "09:30";

                    // Calculate time for a group
                    const getGroupTime = (groupNum: number) => {
                      const [h, m] = firstTee.split(":").map(Number);
                      const totalMins = h * 60 + m + (groupNum - 1) * interval;
                      const newH = Math.floor(totalMins / 60) % 24;
                      const newM = totalMins % 60;
                      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
                    };

                    // Handle drag start
                    const handleDragStart = (
                      e: React.DragEvent,
                      memberId: string,
                      memberName: string,
                      fromGroup: number,
                    ) => {
                      e.dataTransfer.setData("memberId", memberId);
                      e.dataTransfer.setData("memberName", memberName);
                      e.dataTransfer.setData("fromGroup", fromGroup.toString());
                      setMovingPlayer({
                        memberId,
                        name: memberName,
                        fromGroup,
                      });
                    };

                    // Handle drop on a group
                    const handleDrop = async (
                      e: React.DragEvent,
                      toGroup: number,
                    ) => {
                      e.preventDefault();
                      const memberId = e.dataTransfer.getData("memberId");
                      const fromGroup = parseInt(
                        e.dataTransfer.getData("fromGroup"),
                      );
                      if (fromGroup === toGroup) return;

                      setSavingTeeTimes(true);
                      try {
                        await fetch("/api/tee-times", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "move_player",
                            event_id: id,
                            member_id: memberId,
                            from_group: fromGroup,
                            to_group: toGroup,
                          }),
                        });
                        loadData();
                      } catch (err) {
                        console.error(err);
                      }
                      setSavingTeeTimes(false);
                      setMovingPlayer(null);
                    };

                    // Handle drop back to unassigned
                    const handleDropUnassigned = async (e: React.DragEvent) => {
                      e.preventDefault();
                      const memberId = e.dataTransfer.getData("memberId");
                      const fromGroup = parseInt(
                        e.dataTransfer.getData("fromGroup"),
                      );
                      if (fromGroup === 0) return;

                      setSavingTeeTimes(true);
                      try {
                        await fetch("/api/tee-times", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "remove_player",
                            event_id: id,
                            member_id: memberId,
                            group_number: fromGroup,
                          }),
                        });
                        loadData();
                      } catch (err) {
                        console.error(err);
                      }
                      setSavingTeeTimes(false);
                      setMovingPlayer(null);
                    };

                    // Add new empty group
                    const addGroup = async () => {
                      const nextGroup = data.teeTimes.length + 1;
                      setSavingTeeTimes(true);
                      try {
                        await fetch("/api/tee-times", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            action: "add_group",
                            event_id: id,
                            group_number: nextGroup,
                            tee_time: getGroupTime(nextGroup),
                          }),
                        });
                        loadData();
                      } catch (err) {
                        console.error(err);
                      }
                      setSavingTeeTimes(false);
                    };

                    return (
                      <div className="flex gap-4" style={{ minHeight: "60vh" }}>
                        {/* LEFT: Unassigned Players */}
                        <div
                          className="w-1/3 bg-gray-50 rounded-2xl p-4 border-2 border-dashed border-gray-200"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDropUnassigned}
                        >
                          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <span>👥 Players</span>
                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                              {unassigned.length}
                            </span>
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">
                            Drag players to a time slot →
                          </p>
                          <div className="space-y-2">
                            {unassigned
                              .sort((a, b) => {
                                const sA = (a.name || "")
                                  .trim()
                                  .split(" ")
                                  .slice(-1)[0];
                                const sB = (b.name || "")
                                  .trim()
                                  .split(" ")
                                  .slice(-1)[0];
                                return sA.localeCompare(sB);
                              })
                              .map((p) => (
                                <div
                                  key={p.member_id}
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(e, p.member_id, p.name, 0)
                                  }
                                  onDragEnd={() => setMovingPlayer(null)}
                                  className={`bg-white px-3 py-2 rounded-lg shadow-sm cursor-grab active:cursor-grabbing flex justify-between items-center hover:shadow-md transition-shadow ${
                                    movingPlayer?.memberId === p.member_id
                                      ? "ring-2 ring-fairway-500 bg-fairway-50"
                                      : ""
                                  }`}
                                >
                                  <span className="font-medium text-gray-800">
                                    {p.name}
                                  </span>
                                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                    {p.handicap}
                                  </span>
                                </div>
                              ))}
                            {unassigned.length === 0 && (
                              <p className="text-sm text-gray-400 text-center py-8">
                                All players assigned ✓
                              </p>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: Tee Time Slots */}
                        <div className="w-2/3 space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-700">
                              ⏰ Tee Sheet
                            </h3>
                            <button
                              onClick={addGroup}
                              disabled={savingTeeTimes}
                              className="text-xs bg-fairway-900 text-white px-3 py-1.5 rounded-lg hover:bg-fairway-800"
                            >
                              + Add Slot
                            </button>
                          </div>

                          {data.teeTimes.length === 0 ? (
                            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                              <p className="text-gray-400 mb-4">
                                No tee times set yet
                              </p>
                              <button
                                onClick={addGroup}
                                className="bg-fairway-900 text-white px-4 py-2 rounded-xl text-sm font-medium"
                              >
                                + Create First Slot
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {data.teeTimes.map((tt) => (
                                <div
                                  key={tt.id}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => handleDrop(e, tt.group_number)}
                                  className={`bg-white rounded-xl p-3 shadow-sm border-2 transition-all ${
                                    movingPlayer &&
                                    movingPlayer.fromGroup !== tt.group_number
                                      ? "border-fairway-400 bg-fairway-50"
                                      : "border-transparent"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    {/* Time Column */}
                                    <div className="w-20 flex-shrink-0">
                                      {editingTime?.groupId === tt.id ? (
                                        <div className="flex flex-col gap-1">
                                          <input
                                            type="time"
                                            value={editingTime.time}
                                            onChange={(e) =>
                                              setEditingTime({
                                                ...editingTime,
                                                time: e.target.value,
                                              })
                                            }
                                            className="border border-gray-200 rounded px-1 py-0.5 text-sm w-full"
                                          />
                                          <div className="flex gap-1">
                                            <button
                                              onClick={updateTeeTime}
                                              className="text-xs bg-fairway-900 text-white px-2 py-0.5 rounded flex-1"
                                            >
                                              ✓
                                            </button>
                                            <button
                                              onClick={() =>
                                                setEditingTime(null)
                                              }
                                              className="text-xs text-gray-400"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            setEditingTime({
                                              groupId: tt.id,
                                              time:
                                                tt.tee_time ||
                                                getGroupTime(tt.group_number),
                                            })
                                          }
                                          className="text-lg font-bold text-fairway-900 hover:underline"
                                        >
                                          {tt.tee_time ||
                                            getGroupTime(tt.group_number)}
                                        </button>
                                      )}
                                      <p className="text-xs text-gray-400">
                                        Group {tt.group_number}
                                      </p>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                      onClick={async () => {
                                        if (
                                          tt.members.length > 0 &&
                                          !confirm(
                                            `Delete slot with ${tt.members.length} player(s)?`,
                                          )
                                        )
                                          return;
                                        setSavingTeeTimes(true);
                                        await fetch("/api/tee-times", {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            action: "delete_group",
                                            event_id: id,
                                            group_id: tt.id,
                                          }),
                                        });
                                        loadData();
                                        setSavingTeeTimes(false);
                                      }}
                                      className="text-gray-300 hover:text-red-500 transition-colors p-1 self-start"
                                      title="Delete slot"
                                    >
                                      🗑️
                                    </button>

                                    {/* Players Column */}
                                    <div className="flex-1 min-h-[60px] flex flex-wrap gap-2 items-start content-start">
                                      {tt.members.map(
                                        (m: {
                                          id: string;
                                          name: string;
                                          handicap: number;
                                        }) => (
                                          <div
                                            key={m.id}
                                            className="relative group"
                                          >
                                            <div
                                              draggable
                                              onDragStart={(e) =>
                                                handleDragStart(
                                                  e,
                                                  m.id,
                                                  m.name,
                                                  tt.group_number,
                                                )
                                              }
                                              onDragEnd={() =>
                                                setMovingPlayer(null)
                                              }
                                              className={`bg-fairway-100 text-fairway-900 px-3 py-1.5 rounded-lg cursor-grab active:cursor-grabbing flex items-center gap-2 hover:bg-fairway-200 transition-colors ${
                                                movingPlayer?.memberId === m.id
                                                  ? "ring-2 ring-fairway-500"
                                                  : ""
                                              }`}
                                            >
                                              <span className="font-medium text-sm">
                                                {m.name}
                                              </span>
                                              <span className="text-xs text-fairway-600">
                                                ({m.handicap})
                                              </span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setDnsModal({
                                                    teeTimeId: tt.id,
                                                    memberId: m.id,
                                                    memberName: m.name,
                                                  });
                                                }}
                                                className="ml-1 opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-red-600 transition-all"
                                                title="Mark as Did Not Show"
                                              >
                                                🚫
                                              </button>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                      {tt.members.length === 0 &&
                                        !addingToGroup && (
                                          <p className="text-xs text-gray-400 italic py-2">
                                            Drop players here or click + Add
                                          </p>
                                        )}

                                      {/* Add Player Button & Dropdown */}
                                      {addingToGroup === tt.group_number ? (
                                        <div className="w-full mt-1">
                                          <div className="flex gap-1 mb-1">
                                            <input
                                              type="text"
                                              placeholder="Search members..."
                                              value={memberSearch}
                                              onChange={(e) =>
                                                setMemberSearch(e.target.value)
                                              }
                                              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm"
                                              autoFocus
                                            />
                                            <button
                                              onClick={() => {
                                                setAddingToGroup(null);
                                                setMemberSearch("");
                                              }}
                                              className="text-xs text-gray-400 px-2"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                          <div className="max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg">
                                            {loadingMembers ? (
                                              <p className="text-xs text-gray-400 p-2">
                                                Loading...
                                              </p>
                                            ) : (
                                              allMembers
                                                .filter((m) => {
                                                  const assignedIds = new Set(
                                                    data.teeTimes.flatMap((t) =>
                                                      t.members.map(
                                                        (p) => p.id,
                                                      ),
                                                    ),
                                                  );
                                                  const alreadyAssigned =
                                                    assignedIds.has(m.id);
                                                  const matchesSearch =
                                                    memberSearch === "" ||
                                                    m.name
                                                      .toLowerCase()
                                                      .includes(
                                                        memberSearch.toLowerCase(),
                                                      );
                                                  return (
                                                    !alreadyAssigned &&
                                                    matchesSearch
                                                  );
                                                })
                                                .sort((a, b) => {
                                                  const sA = (a.name || "")
                                                    .trim()
                                                    .split(" ")
                                                    .slice(-1)[0];
                                                  const sB = (b.name || "")
                                                    .trim()
                                                    .split(" ")
                                                    .slice(-1)[0];
                                                  return sA.localeCompare(sB);
                                                })
                                                .map((m) => (
                                                  <button
                                                    key={m.id}
                                                    onClick={async () => {
                                                      if (savingTeeTimes)
                                                        return;
                                                      setSavingTeeTimes(true);
                                                      // 1. Create RSVP
                                                      await fetch(
                                                        "/api/rsvps",
                                                        {
                                                          method: "POST",
                                                          headers: {
                                                            "Content-Type":
                                                              "application/json",
                                                          },
                                                          body: JSON.stringify({
                                                            event_id: id,
                                                            member_id: m.id,
                                                            status: "confirmed",
                                                          }),
                                                        },
                                                      );
                                                      // 2. Add to tee time group
                                                      const updatedGroups =
                                                        data.teeTimes.map(
                                                          (t) => ({
                                                            group_number:
                                                              t.group_number,
                                                            tee_time:
                                                              t.tee_time,
                                                            member_ids:
                                                              t.group_number ===
                                                              tt.group_number
                                                                ? [
                                                                    ...t.members.map(
                                                                      (p) =>
                                                                        p.id,
                                                                    ),
                                                                    m.id,
                                                                  ]
                                                                : t.members.map(
                                                                    (p) => p.id,
                                                                  ),
                                                          }),
                                                        );
                                                      await fetch(
                                                        "/api/tee-times",
                                                        {
                                                          method: "POST",
                                                          headers: {
                                                            "Content-Type":
                                                              "application/json",
                                                          },
                                                          body: JSON.stringify({
                                                            event_id: id,
                                                            groups:
                                                              updatedGroups,
                                                          }),
                                                        },
                                                      );
                                                      setAddingToGroup(null);
                                                      setMemberSearch("");
                                                      loadData();
                                                      setSavingTeeTimes(false);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-fairway-50 text-sm flex justify-between border-b border-gray-50 last:border-0"
                                                  >
                                                    <span>{m.name}</span>
                                                    <span className="text-xs text-gray-400">
                                                      {m.handicap}
                                                    </span>
                                                  </button>
                                                ))
                                            )}
                                            {!loadingMembers &&
                                              allMembers.filter((m) => {
                                                const assignedIds = new Set(
                                                  data.teeTimes.flatMap((t) =>
                                                    t.members.map((p) => p.id),
                                                  ),
                                                );
                                                return (
                                                  !assignedIds.has(m.id) &&
                                                  (memberSearch === "" ||
                                                    m.name
                                                      .toLowerCase()
                                                      .includes(
                                                        memberSearch.toLowerCase(),
                                                      ))
                                                );
                                              }).length === 0 && (
                                                <p className="text-xs text-gray-400 p-2 text-center">
                                                  No matching members
                                                </p>
                                              )}
                                          </div>
                                        </div>
                                      ) : (
                                        tt.members.length < 4 && (
                                          <button
                                            onClick={async () => {
                                              setAddingToGroup(tt.group_number);
                                              setMemberSearch("");
                                              if (allMembers.length === 0) {
                                                setLoadingMembers(true);
                                                try {
                                                  const res =
                                                    await fetch("/api/members");
                                                  const members =
                                                    await res.json();
                                                  setAllMembers(members);
                                                } catch {
                                                  setAllMembers([]);
                                                }
                                                setLoadingMembers(false);
                                              }
                                            }}
                                            className="text-xs bg-fairway-50 text-fairway-700 px-3 py-1.5 rounded-lg hover:bg-fairway-100 font-medium transition-colors"
                                          >
                                            + Add Player
                                          </button>
                                        )
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                {/* DNS Modal */}
                {dnsModal && (
                  <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setDnsModal(null)}
                  >
                    <div
                      className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Mark as Did Not Show
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Marking <strong>{dnsModal.memberName}</strong> as DNS
                        will:
                      </p>
                      <ul className="text-sm text-gray-600 mb-4 space-y-1 list-disc list-inside">
                        <li>Keep them on the tee sheet (grayed out)</li>
                        <li>Exclude their scorecard from results</li>
                        <li>Exclude them from GOTY standings</li>
                      </ul>

                      <label className="block mb-4">
                        <span className="text-sm font-medium text-gray-700 mb-2 block">
                          Reason:
                        </span>
                        <select
                          value={dnsReason}
                          onChange={(e) => setDnsReason(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-fairway-800 focus:outline-none"
                        >
                          <option value="Withdrew">Withdrew</option>
                          <option value="No-show">No-show</option>
                          <option value="Illness">Illness</option>
                          <option value="Emergency">Emergency</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setDnsModal(null)}
                          disabled={markingDns}
                          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => markDns(dnsModal.teeTimeId)}
                          disabled={markingDns}
                          className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {markingDns ? "Marking..." : "Mark DNS"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PAYMENTS TAB */}
            {tab === "payments" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Collect Payments</h3>
                  <div className="text-sm text-gray-500">
                    Green Fee:{" "}
                    <span className="font-bold text-fairway-900">
                      €{((evt?.entry_fee as number) || 0) - 10}
                    </span>
                    {" + "}Prize:{" "}
                    <span className="font-bold text-purple-700">€10</span>
                  </div>
                </div>

                {/* Payment Summary & Player List */}
                {data &&
                  (() => {
                    type RsvpWithPayment = (typeof data.rsvps)[0] & {
                      greenfee_status?: string;
                    };
                    const confirmed = data.rsvps.filter(
                      (r) => r.status === "confirmed",
                    ) as RsvpWithPayment[];
                    const greenFee = ((evt?.entry_fee as number) || 0) - 10;

                    const greenFeePaidSociety = confirmed.filter(
                      (r) => r.greenfee_status === "society",
                    ).length;
                    const greenFeePaidClub = confirmed.filter(
                      (r) => r.greenfee_status === "club",
                    ).length;
                    const societyCollected = greenFeePaidSociety * greenFee;

                    const updatePayment = async (
                      rsvpId: string,
                      field: string,
                      value: string | number,
                    ) => {
                      await fetch("/api/rsvps", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          rsvp_id: rsvpId,
                          [field]: value,
                        }),
                      });
                      loadData();
                    };

                    return (
                      <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold text-fairway-900">
                              {confirmed.length}
                            </p>
                            <p className="text-xs text-gray-500">Players</p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold text-green-700">
                              €{societyCollected}
                            </p>
                            <p className="text-xs text-gray-500">
                              Society Collected
                            </p>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-4 shadow-sm text-center">
                            <p className="text-2xl font-bold text-blue-700">
                              {greenFeePaidClub}
                            </p>
                            <p className="text-xs text-gray-500">
                              Paid Club Direct
                            </p>
                          </div>
                        </div>

                        {/* Player Payment List */}
                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                          <div className="grid grid-cols-9 gap-2 px-4 py-2 bg-gray-50 text-xs font-bold text-gray-600">
                            <div className="col-span-4">Player</div>
                            <div className="col-span-5 text-center">
                              Green Fee (€{greenFee})
                            </div>
                          </div>
                          {confirmed
                            .sort((a, b) => {
                              const sA = (a.name || "")
                                .trim()
                                .split(" ")
                                .slice(-1)[0];
                              const sB = (b.name || "")
                                .trim()
                                .split(" ")
                                .slice(-1)[0];
                              return sA.localeCompare(sB);
                            })
                            .map((r, i) => (
                              <div
                                key={r.id}
                                className={`grid grid-cols-9 gap-2 px-4 py-3 items-center ${i > 0 ? "border-t border-gray-50" : ""}`}
                              >
                                <div className="col-span-4">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {r.name}
                                  </p>
                                </div>
                                <div className="col-span-5 flex justify-center gap-1">
                                  <button
                                    onClick={() =>
                                      updatePayment(
                                        r.id,
                                        "greenfee_status",
                                        r.greenfee_status === "society"
                                          ? "unpaid"
                                          : "society",
                                      )
                                    }
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      r.greenfee_status === "society"
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-green-100"
                                    }`}
                                  >
                                    Society
                                  </button>
                                  <button
                                    onClick={() =>
                                      updatePayment(
                                        r.id,
                                        "greenfee_status",
                                        r.greenfee_status === "club"
                                          ? "unpaid"
                                          : "club",
                                      )
                                    }
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      r.greenfee_status === "club"
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-blue-100"
                                    }`}
                                  >
                                    Club
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={async () => {
                              if (
                                !confirm(
                                  "Mark all green fees as paid to Society?",
                                )
                              )
                                return;
                              for (const r of confirmed.filter(
                                (p) =>
                                  p.greenfee_status !== "society" &&
                                  p.greenfee_status !== "club",
                              )) {
                                await updatePayment(
                                  r.id,
                                  "greenfee_status",
                                  "society",
                                );
                              }
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
                          >
                            All → Society
                          </button>
                        </div>
                      </>
                    );
                  })()}
              </div>
            )}

            {/* PRIZES TAB */}
            {tab === "prizes" && (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">
                  💰 Prize Configuration
                </h3>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">ℹ️</span>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 mb-1">
                        Prize Calculation Modes
                      </p>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>
                          <strong>Auto:</strong> System calculates prizes based
                          on Society payments (Prize Pool = Payments × 30%)
                        </li>
                        <li>
                          <strong>Manual:</strong> Set specific euro amounts for
                          each prize category
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {manualPrizes ? (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          🔧 Manual Prize Configuration
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Custom prize amounts (overrides auto-calculation)
                        </p>
                      </div>
                      <button
                        onClick={revertToAutoPrizes}
                        disabled={savingPrizes}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Revert to Auto
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Overall Prizes */}
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">
                          🏆 Overall Winners
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              1st Place
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.first}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    first: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="0"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              2nd Place
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.second}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    second: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="0"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              3rd Place
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.third}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    third: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="0"
                                min="0"
                              />
                            </div>
                          </div>

                          {/* Captain's/President's Prize Class Winners - Show for both captains and presidents */}
                          {(editForm.event_type === "captains" || editForm.event_type === "presidents") && (
                            <>
                              <div className="border-t border-gray-200 pt-3 mt-3">
                                <h6 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                  Class 1 Winners
                                </h6>
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      1st in Class
                                    </label>
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mr-2 text-sm">
                                        €
                                      </span>
                                      <input
                                        type="number"
                                        value={prizeConfig.class1_first}
                                        onChange={(e) =>
                                          setPrizeConfig({
                                            ...prizeConfig,
                                            class1_first: Number(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="40"
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      2nd in Class
                                    </label>
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mr-2 text-sm">
                                        €
                                      </span>
                                      <input
                                        type="number"
                                        value={prizeConfig.class1_second}
                                        onChange={(e) =>
                                          setPrizeConfig({
                                            ...prizeConfig,
                                            class1_second: Number(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="30"
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="border-t border-gray-200 pt-3 mt-3">
                                <h6 className="text-xs font-semibold text-gray-600 uppercase mb-2">
                                  Class 2 Winners
                                </h6>
                                <div className="space-y-2">
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      1st in Class
                                    </label>
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mr-2 text-sm">
                                        €
                                      </span>
                                      <input
                                        type="number"
                                        value={prizeConfig.class2_first}
                                        onChange={(e) =>
                                          setPrizeConfig({
                                            ...prizeConfig,
                                            class2_first: Number(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="40"
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                      2nd in Class
                                    </label>
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mr-2 text-sm">
                                        €
                                      </span>
                                      <input
                                        type="number"
                                        value={prizeConfig.class2_second}
                                        onChange={(e) =>
                                          setPrizeConfig({
                                            ...prizeConfig,
                                            class2_second: Number(
                                              e.target.value,
                                            ),
                                          })
                                        }
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="30"
                                        min="0"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 9-Hole & Other Prizes */}
                      <div>
                        <h5 className="font-semibold text-gray-900 mb-3">
                          🎯 Other Prizes
                        </h5>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Front 9 Winner
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.front9}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    front9: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="25"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Back 9 Winner
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.back9}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    back9: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="25"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Twos Pot (total pool)
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.twos}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    twos: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="0"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Best Visitor
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.visitor}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    visitor: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="0"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nearest the Pin
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.nearest_pin}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    nearest_pin: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="20"
                                min="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Longest Drive
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">€</span>
                              <input
                                type="number"
                                value={prizeConfig.longest_drive}
                                onChange={(e) =>
                                  setPrizeConfig({
                                    ...prizeConfig,
                                    longest_drive: Number(e.target.value),
                                  })
                                }
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="20"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={savePrizeConfig}
                        disabled={savingPrizes}
                        className="bg-fairway-900 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                      >
                        {savingPrizes
                          ? "Saving..."
                          : "✅ Save Prize Configuration"}
                      </button>
                      <button
                        onClick={() => {
                          const total =
                            prizeConfig.first +
                            prizeConfig.second +
                            prizeConfig.third +
                            prizeConfig.front9 +
                            prizeConfig.back9;
                          const totalWithTwos = total + prizeConfig.twos;
                          alert(
                            `Total Prizes: €${totalWithTwos}\n\n1st: €${prizeConfig.first}\n2nd: €${prizeConfig.second}\n3rd: €${prizeConfig.third}\nFront 9: €${prizeConfig.front9}\nBack 9: €${prizeConfig.back9}\nTwos Pot: €${prizeConfig.twos}\nVisitor: €${prizeConfig.visitor}`,
                          );
                        }}
                        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold"
                      >
                        📊 Preview Total
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          ⚙️ Auto Prize Calculation
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Prizes calculated automatically from Society payments
                        </p>
                      </div>
                      <button
                        onClick={() => setManualPrizes(true)}
                        className="bg-fairway-900 text-white px-4 py-2 rounded-xl text-sm font-semibold"
                      >
                        🔧 Switch to Manual
                      </button>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Auto-Calculation (Fixed Amounts):</strong>
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• 1st Place: €80 (fixed)</li>
                        <li>• 2nd Place: €60 (fixed)</li>
                        <li>• 3rd Place: €40 (fixed)</li>
                        <li>• Front 9: €25 (fixed)</li>
                        <li>• Back 9: €25 (fixed)</li>
                        <li>• Twos: Variable pot (shared among winners)</li>
                      </ul>
                      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                        <p className="text-xs text-blue-900">
                          <strong>Total Standard Prizes:</strong> €230
                          <br />
                          (1st: €80 + 2nd: €60 + 3rd: €40 + F9: €25 + B9: €25)
                          <br />
                          Plus Twos pot and any additional prizes
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-xl">💡</span>
                        <div>
                          <p className="text-sm font-semibold text-yellow-900">
                            When to use Manual?
                          </p>
                          <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                            <li>• Captain's Day with sponsored prizes</li>
                            <li>• Special events with fixed prize amounts</li>
                            <li>
                              • When you want different splits than 50/30/20
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SCORECARDS TAB */}
            {tab === "scorecards" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Scorecards</h3>
                  <Link
                    href={`/admin/event/${id}/print-scorecards`}
                    className="bg-fairway-900 text-white px-4 py-2 rounded-xl text-sm font-medium"
                  >
                    🖨️ Print All
                  </Link>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  Tap a player to enter/edit their scores
                </p>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {confirmedPlayers.length === 0 ? (
                    <p className="p-4 text-sm text-gray-400">
                      No confirmed players yet
                    </p>
                  ) : (
                    [...confirmedPlayers]
                      .sort((a, b) => {
                        const sA = (a.name || "")
                          .trim()
                          .split(" ")
                          .slice(-1)[0];
                        const sB = (b.name || "")
                          .trim()
                          .split(" ")
                          .slice(-1)[0];
                        return sA.localeCompare(sB);
                      })
                      .map((player, i) => {
                        const scorecard = data.scorecards.find(
                          (sc) => sc.member_id === player.member_id,
                        );
                        return (
                          <div
                            key={player.id}
                            className={`w-full flex items-center px-4 py-3 ${i > 0 ? "border-t border-gray-50" : ""}`}
                          >
                            <span className="w-6 text-center">
                              {scorecard?.dns
                                ? "🚫"
                                : scorecard?.status === "submitted"
                                  ? "✅"
                                  : scorecard
                                    ? "⏳"
                                    : "📝"}
                            </span>
                            <button
                              onClick={() =>
                                openScoreEntry({
                                  member_id: player.member_id,
                                  name: player.name,
                                  handicap: player.handicap,
                                })
                              }
                              className="flex-1 ml-3 text-left hover:bg-fairway-50 transition-colors rounded-lg p-2 -m-2"
                            >
                              <p
                                className={`text-sm font-medium ${scorecard?.dns ? "text-gray-400 line-through" : "text-gray-900"}`}
                              >
                                {player.name}
                                {Boolean(scorecard?.dns) && (
                                  <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    DNS - {scorecard.dns_reason}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-400">
                                Hcp {player.handicap}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openHandicapEdit({
                                      member_id: player.member_id,
                                      name: player.name,
                                      handicap: player.handicap,
                                    });
                                  }}
                                  className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium"
                                  title="Quick edit handicap"
                                >
                                  Edit
                                </button>
                                ·{" "}
                                {scorecard?.status === "submitted"
                                  ? "Submitted"
                                  : scorecard
                                    ? `${scorecard.holes_completed}/18`
                                    : "No scores yet"}
                              </p>
                            </button>
                            <div className="flex items-center gap-2">
                              {scorecard ? (
                                <>
                                  <div className="text-right mr-2">
                                    <p className="text-lg font-bold text-fairway-900">
                                      {scorecard.total_points || "-"}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      {scorecard.total_gross || "-"} gross
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openScoreEntry({
                                        member_id: player.member_id,
                                        name: player.name,
                                        handicap: player.handicap,
                                      });
                                    }}
                                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-lg font-medium hover:bg-blue-200"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (
                                        confirm(
                                          "Reset scorecard to empty? Player can re-enter all scores.",
                                        )
                                      ) {
                                        await fetch(
                                          `/api/scorecards/${scorecard.id}/reset`,
                                          { method: "POST" },
                                        );
                                        loadData();
                                      }
                                    }}
                                    className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-lg font-medium hover:bg-yellow-200"
                                  >
                                    🔄 Reset
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-fairway-800 font-medium">
                                  Enter →
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}

            {/* SIDE COMPS TAB */}
            {tab === "sidecomps" && (
              <div>
                <h3 className="font-bold text-gray-900 mb-4">
                  Side Competitions
                </h3>

                {/* NTP Section — independent state */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
                  <h4 className="font-bold text-gray-900 mb-3">
                    🎯 Nearest the Pin
                  </h4>
                  {data.sideComps
                    .filter((s) => s.type === "ntp")
                    .map((sc) => (
                      <div key={sc.id} className="py-2 border-b border-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            Hole {sc.hole_number}:{" "}
                            <span className="font-bold">{sc.member_name}</span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setNtpHole(sc.hole_number);
                                setNtpMemberId("");
                                setNtpSearch("");
                              }}
                              className="text-xs text-fairway-800 hover:text-fairway-600 px-2"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `Remove NTP: ${sc.member_name} (Hole ${sc.hole_number})?`,
                                  )
                                )
                                  return;
                                await fetch("/api/side-comps", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    action: "delete",
                                    event_id: id,
                                    type: "ntp",
                                    hole_number: sc.hole_number,
                                  }),
                                });
                                loadData();
                              }}
                              className="text-xs text-red-400 hover:text-red-600 px-2"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Add NTP Result</p>
                    <select
                      value={ntpHole}
                      onChange={(e) => setNtpHole(Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2 w-full"
                    >
                      <option value={0}>Select hole</option>
                      {(data.holes.length > 0
                        ? data.holes.filter((h) => h.par === 3)
                        : Array.from({ length: 18 }, (_, i) => ({
                            hole_number: i + 1,
                          }))
                      ).map((h) => (
                        <option key={h.hole_number} value={h.hole_number}>
                          Hole {h.hole_number}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search player..."
                      value={ntpSearch}
                      onChange={(e) => {
                        setNtpSearch(e.target.value);
                        setNtpMemberId("");
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2"
                    />
                    {ntpSearch && !ntpMemberId && (
                      <div className="max-h-32 overflow-y-auto space-y-1 mb-2 border border-gray-100 rounded-lg">
                        {data.rsvps
                          .filter(
                            (r) =>
                              r.status === "confirmed" &&
                              r.name
                                .toLowerCase()
                                .includes(ntpSearch.toLowerCase()),
                          )
                          .sort((a, b) => {
                            const sA = (a.name || "")
                              .trim()
                              .split(" ")
                              .slice(-1)[0];
                            const sB = (b.name || "")
                              .trim()
                              .split(" ")
                              .slice(-1)[0];
                            return sA.localeCompare(sB);
                          })
                          .map((r) => (
                            <button
                              key={r.member_id}
                              onClick={() => {
                                setNtpMemberId(r.member_id);
                                setNtpSearch(r.name);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-fairway-50 border-b border-gray-50 last:border-0"
                            >
                              {r.name}
                            </button>
                          ))}
                      </div>
                    )}
                    {ntpMemberId && (
                      <p className="text-sm text-fairway-800 font-medium mb-2">
                        ✅ {ntpSearch}
                      </p>
                    )}
                    <button
                      onClick={saveNtp}
                      disabled={!ntpMemberId || !ntpHole}
                      className="bg-fairway-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-full"
                    >
                      Save NTP
                    </button>
                  </div>
                </div>

                {/* Longest Drive — independent state */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h4 className="font-bold text-gray-900 mb-3">
                    💥 Longest Drive
                  </h4>
                  {data.sideComps
                    .filter((s) => s.type === "longest_drive")
                    .map((sc) => (
                      <div key={sc.id} className="py-2 border-b border-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            Hole {sc.hole_number}:{" "}
                            <span className="font-bold">{sc.member_name}</span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setLdHole(sc.hole_number);
                                setLdMemberId("");
                                setLdSearch("");
                              }}
                              className="text-xs text-fairway-800 hover:text-fairway-600 px-2"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `Remove Longest Drive: ${sc.member_name} (Hole ${sc.hole_number})?`,
                                  )
                                )
                                  return;
                                await fetch("/api/side-comps", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    action: "delete",
                                    event_id: id,
                                    type: "longest_drive",
                                    hole_number: sc.hole_number,
                                  }),
                                });
                                loadData();
                              }}
                              className="text-xs text-red-400 hover:text-red-600 px-2"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">
                      Add Longest Drive Result
                    </p>
                    <select
                      value={ldHole}
                      onChange={(e) => setLdHole(Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2 w-full"
                    >
                      <option value={0}>Select hole</option>
                      {(data.holes.length > 0
                        ? data.holes
                        : Array.from({ length: 18 }, (_, i) => ({
                            hole_number: i + 1,
                            par: 0,
                          }))
                      ).map((h) => (
                        <option key={h.hole_number} value={h.hole_number}>
                          Hole {h.hole_number}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search player..."
                      value={ldSearch}
                      onChange={(e) => {
                        setLdSearch(e.target.value);
                        setLdMemberId("");
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2"
                    />
                    {ldSearch && !ldMemberId && (
                      <div className="max-h-32 overflow-y-auto space-y-1 mb-2 border border-gray-100 rounded-lg">
                        {data.rsvps
                          .filter(
                            (r) =>
                              r.status === "confirmed" &&
                              r.name
                                .toLowerCase()
                                .includes(ldSearch.toLowerCase()),
                          )
                          .sort((a, b) => {
                            const sA = (a.name || "")
                              .trim()
                              .split(" ")
                              .slice(-1)[0];
                            const sB = (b.name || "")
                              .trim()
                              .split(" ")
                              .slice(-1)[0];
                            return sA.localeCompare(sB);
                          })
                          .map((r) => (
                            <button
                              key={r.member_id}
                              onClick={() => {
                                setLdMemberId(r.member_id);
                                setLdSearch(r.name);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-fairway-50 border-b border-gray-50 last:border-0"
                            >
                              {r.name}
                            </button>
                          ))}
                      </div>
                    )}
                    {ldMemberId && (
                      <p className="text-sm text-fairway-800 font-medium mb-2">
                        ✅ {ldSearch}
                      </p>
                    )}
                    <button
                      onClick={saveLd}
                      disabled={!ldMemberId || !ldHole}
                      className="bg-fairway-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-full"
                    >
                      Save Longest Drive
                    </button>
                  </div>
                </div>

                {/* Twos Competition */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-900">🏆 Twos</h4>
                    {(() => {
                      const twosCount = data.sideComps.filter(
                        (s) => s.type === "twos",
                      ).length;
                      const twosPot = 25; // Default - should pull from prize_config if available
                      const splitAmount =
                        twosCount > 0
                          ? Math.round((twosPot / twosCount) * 100) / 100
                          : 0;
                      return twosCount > 0 ? (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">
                            {twosCount} winner{twosCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-gray-400 mx-1">•</span>
                          <span>€{splitAmount.toFixed(2)} each</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  {data.sideComps
                    .filter((s) => s.type === "twos")
                    .map((sc) => (
                      <div key={sc.id} className="py-2 border-b border-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            Hole {sc.hole_number}:{" "}
                            <span className="font-bold">{sc.member_name}</span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setTwosHole(sc.hole_number);
                                setTwosMemberId("");
                                setTwosSearch("");
                              }}
                              className="text-xs text-fairway-800 hover:text-fairway-600 px-2"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `Remove Two: ${sc.member_name} (Hole ${sc.hole_number})?`,
                                  )
                                )
                                  return;
                                await fetch("/api/side-comps", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    action: "delete",
                                    event_id: id,
                                    type: "twos",
                                    hole_number: sc.hole_number,
                                    member_id: sc.member_id,
                                  }),
                                });
                                loadData();
                              }}
                              className="text-xs text-red-400 hover:text-red-600 px-2"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">
                      Add Two (Par 3 birdie)
                    </p>
                    <select
                      value={twosHole}
                      onChange={(e) => setTwosHole(Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2 w-full"
                    >
                      <option value={0}>Select par 3 hole</option>
                      {(data.holes.length > 0
                        ? data.holes.filter((h) => h.par === 3)
                        : Array.from({ length: 18 }, (_, i) => ({
                            hole_number: i + 1,
                          }))
                      ).map((h) => (
                        <option key={h.hole_number} value={h.hole_number}>
                          Hole {h.hole_number}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Search player..."
                      value={twosSearch}
                      onChange={(e) => {
                        setTwosSearch(e.target.value);
                        setTwosMemberId("");
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2"
                    />
                    {twosSearch && !twosMemberId && (
                      <div className="max-h-32 overflow-y-auto space-y-1 mb-2 border border-gray-100 rounded-lg">
                        {data.rsvps
                          .filter(
                            (r) =>
                              r.status === "confirmed" &&
                              r.name
                                .toLowerCase()
                                .includes(twosSearch.toLowerCase()),
                          )
                          .sort((a, b) => {
                            const sA = (a.name || "")
                              .trim()
                              .split(" ")
                              .slice(-1)[0];
                            const sB = (b.name || "")
                              .trim()
                              .split(" ")
                              .slice(-1)[0];
                            return sA.localeCompare(sB);
                          })
                          .map((r) => (
                            <button
                              key={r.member_id}
                              onClick={() => {
                                setTwosMemberId(r.member_id);
                                setTwosSearch(r.name);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-fairway-50 border-b border-gray-50 last:border-0"
                            >
                              {r.name}
                            </button>
                          ))}
                      </div>
                    )}
                    {twosMemberId && (
                      <p className="text-sm text-fairway-800 font-medium mb-2">
                        ✅ {twosSearch}
                      </p>
                    )}
                    <button
                      onClick={saveTwos}
                      disabled={!twosMemberId || !twosHole}
                      className="bg-fairway-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-full"
                    >
                      Save Two
                    </button>
                  </div>
                </div>

                {/* Add Visitor */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
                  <h4 className="font-bold text-gray-900 mb-3">
                    🏍️ Add Visitor
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Add a visitor who can play but won't win regular prizes
                  </p>
                  <input
                    type="text"
                    placeholder="Visitor name..."
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                  />
                  <input
                    type="number"
                    placeholder="Handicap"
                    value={visitorHandicap}
                    onChange={(e) => setVisitorHandicap(e.target.value)}
                    step="0.1"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                  />
                  <button
                    onClick={async () => {
                      if (!visitorName || !visitorHandicap) return;
                      // Create visitor member
                      const res = await fetch("/api/members", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: visitorName,
                          handicap: parseFloat(visitorHandicap),
                          member_type: "visitor",
                          status: "active",
                        }),
                      });
                      const visitor = await res.json();
                      // Create RSVP for this event
                      await fetch("/api/rsvps", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          event_id: id,
                          member_id: visitor.id,
                          status: "confirmed",
                        }),
                      });
                      setVisitorName("");
                      setVisitorHandicap("");
                      alert(`✅ Visitor added: ${visitorName}`);
                      loadData();
                    }}
                    disabled={!visitorName || !visitorHandicap}
                    className="bg-fairway-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-full"
                  >
                    Add Visitor to Event
                  </button>
                </div>

                {/* Visitors Prize Winner */}
                <div className="bg-white rounded-2xl p-5 shadow-sm mt-4">
                  <h4 className="font-bold text-gray-900 mb-3">
                    🏆 Visitors Prize
                  </h4>
                  {data.sideComps
                    .filter((s) => s.type === "visitors")
                    .map((sc) => (
                      <div key={sc.id} className="py-2 border-b border-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">
                            <span className="font-bold">{sc.member_name}</span>{" "}
                            — {sc.value} points
                          </span>
                          <button
                            onClick={async () => {
                              if (!confirm(`Remove: ${sc.member_name}?`))
                                return;
                              await fetch("/api/side-comps", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "delete",
                                  event_id: id,
                                  type: "visitors",
                                  hole_number: 0,
                                  member_id: sc.member_id,
                                }),
                              });
                              loadData();
                            }}
                            className="text-xs text-red-400 hover:text-red-600 px-2"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">
                      Select Visitors Prize Winner
                    </p>
                    <input
                      type="text"
                      placeholder="Search visitor..."
                      value={visitorPoints}
                      onChange={(e) => {
                        setVisitorPoints(e.target.value);
                        setVisitorHandicap("");
                      }}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm mb-2"
                    />
                    {visitorPoints && !visitorHandicap && (
                      <div className="max-h-32 overflow-y-auto space-y-1 mb-2 border border-gray-100 rounded-lg">
                        {data.rsvps
                          .filter(
                            (r) =>
                              r.member_type === "visitor" &&
                              r.name
                                .toLowerCase()
                                .includes(visitorPoints.toLowerCase()),
                          )
                          .sort((a, b) => {
                            const sA = (a.name || "")
                              .trim()
                              .split(" ")
                              .slice(-1)[0];
                            const sB = (b.name || "")
                              .trim()
                              .split(" ")
                              .slice(-1)[0];
                            return sA.localeCompare(sB);
                          })
                          .map((r) => (
                            <button
                              key={r.member_id}
                              onClick={() => {
                                setVisitorHandicap(r.member_id);
                                setVisitorPoints(r.name);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-fairway-50 border-b border-gray-50 last:border-0"
                            >
                              {r.name} (H/C {r.handicap})
                            </button>
                          ))}
                      </div>
                    )}
                    {visitorHandicap && (
                      <p className="text-sm text-fairway-800 font-medium mb-2">
                        ✅ {visitorPoints}
                      </p>
                    )}
                    <input
                      type="number"
                      placeholder="Points scored"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                    />
                    <button
                      onClick={async () => {
                        if (!visitorHandicap || !visitorName) return;
                        await fetch("/api/side-comps", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            event_id: id,
                            type: "visitors",
                            hole_number: 0,
                            member_id: visitorHandicap,
                            value: parseInt(visitorName) || 0,
                            unit: "points",
                          }),
                        });
                        setVisitorHandicap("");
                        setVisitorPoints("");
                        setVisitorName("");
                        loadData();
                      }}
                      disabled={!visitorHandicap || !visitorName}
                      className="bg-fairway-900 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 w-full"
                    >
                      Save Visitors Prize Winner
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* RESULTS TAB */}
            {tab === "results" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">Results</h3>
                    {(results?.prizes?.length > 0 || evt?.results_published === 1) && (
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        evt.results_published === 1 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {evt.results_published === 1 ? '✅ Published to Members' : '🔒 Finalized (Admin Preview)'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        loadData();
                        window.location.reload();
                      }}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={recalculateScores}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      📊 Recalculate Scores
                    </button>
                    <button
                      onClick={finaliseResults}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      🔒 Finalize Results (Admin Preview)
                    </button>
                    {data.event?.status === "finalised" && (
                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              "Revert this event to In Progress?\n\nThis will:\n• Remove all prizes\n• Clear GOTY points for this event\n• Reset deductions for this outing\n• Keep all scorecards\n\nAre you sure?",
                            )
                          )
                            return;
                          const res = await fetch("/api/revert-event", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ event_id: id }),
                          });
                          const result = await res.json();
                          alert(result.message || result.error);
                          loadData();
                        }}
                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        🔄 Revert to In Progress
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (
                          !confirm(
                            "\u26a0\ufe0f FULL RESET - Are you sure?\n\nThis will permanently delete:\n\u2022 All scorecards and scores\n\u2022 All prizes and GOTY points\n\u2022 Side competitions (NTP, LD, Twos)\n\u2022 Outing deductions\n\nThis will KEEP:\n\u2022 Tee times and player groups\n\u2022 RSVPs\n\u2022 Course setup\n\nThis cannot be undone!",
                          )
                        )
                          return;
                        if (
                          !confirm(
                            "Are you REALLY sure? All scores will be permanently deleted.",
                          )
                        )
                          return;
                        const res = await fetch("/api/reset-event-full", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ event_id: id }),
                        });
                        const result = await res.json();
                        alert(result.message || result.error);
                        loadData();
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑\ufe0f Full Reset
                    </button>
                  </div>
                </div>

                {results && results.prizes && results.prizes.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {results.prizes.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl p-3 shadow-sm flex justify-between items-center"
                      >
                        <span className="text-sm font-medium">{p.label}</span>
                        {p.value > 0 && (
                          <span className="text-sm text-fairway-800 font-bold">
                            €{p.value}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm mb-4">
                    <p className="text-gray-400">
                      {results
                        ? "No results yet. Finalise the event to generate results."
                        : "Loading results..."}
                    </p>
                  </div>
                )}

                {/* Status Badge */}
                {evt?.status === "finalised" && (
                  <div className="mb-4">
                    {evt?.results_published === 1 ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                        <span className="text-green-600 font-bold">
                          ✅ Published
                        </span>
                        <span className="text-sm text-green-700">
                          Members can see these results
                        </span>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-blue-600 font-bold">
                            🔒 Finalized (Admin Only)
                          </span>
                        </div>
                        <p className="text-sm text-blue-700">
                          Members cannot see these results yet. Go to{" "}
                          <strong>Admin → Publish</strong> to publish.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {evt?.status !== "finalised" && (
                    <button
                      onClick={finaliseResults}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-blue-700"
                    >
                      🔒 Finalize Results (Admin Preview)
                    </button>
                  )}
                  {evt?.status === "finalised" &&
                    evt?.results_published === 1 && (
                      <button
                        onClick={() => {
                          let text = `🏆 ${evt?.name} Results\n`;
                          if (evt?.course_name) {
                            text += `📍 ${evt.course_name}\n`;
                          }
                          if (evt?.date) {
                            const dateObj = new Date(evt.date + 'T12:00:00');
                            text += `📅 ${dateObj.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
                          }
                          text += '\n';
                          data.prizes.forEach((p) => {
                            text += `${p.label}\n`;
                          });
                          text += "\n⛳ FairwayConnect";
                          window.open(
                            `https://wa.me/?text=${encodeURIComponent(text)}`,
                            "_blank",
                          );
                        }}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-green-700"
                      >
                        📱 Share via WhatsApp
                      </button>
                    )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Quick Handicap Edit Modal */}
      {editingHandicap && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingHandicap(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              Update Handicap Index
            </h3>
            <p className="text-sm text-gray-600 mb-4">{editingHandicap.name}</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <label className="text-xs text-gray-500 block mb-1">
                Current Handicap Index
              </label>
              <p className="text-2xl font-bold text-gray-900">
                {editingHandicap.current_handicap}
              </p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">
                New Handicap Index
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="54"
                value={newHandicap}
                onChange={(e) => setNewHandicap(e.target.value)}
                className="w-full border-2 border-fairway-600 rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-fairway-200"
                autoFocus
              />
            </div>

            {newHandicap && !isNaN(parseFloat(newHandicap)) && (
              <div className="bg-blue-50 rounded-xl p-3 mb-4">
                <p className="text-xs text-gray-600 mb-1">
                  Playing Handicap (this event)
                </p>
                <p className="text-lg font-bold text-blue-900">
                  {Math.round(
                    (parseFloat(newHandicap) *
                      ((evt?.slope_rating as number) || 113)) /
                      113 +
                      (((evt?.course_rating as number) || 72) -
                        ((evt?.course_par as number) || 72)),
                  ) * ((evt?.handicap_allowance as number) || 0.95)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Based on Slope {(evt?.slope_rating as number) || 113}, CR{" "}
                  {(evt?.course_rating as number) || 72}, Par{" "}
                  {(evt?.course_par as number) || 72},{" "}
                  {Math.round(
                    ((evt?.handicap_allowance as number) || 0.95) * 100,
                  )}
                  % allowance
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setEditingHandicap(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-medium hover:bg-gray-200"
                disabled={savingHandicap}
              >
                Cancel
              </button>
              <button
                onClick={saveHandicap}
                className="flex-1 bg-fairway-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-fairway-800 disabled:opacity-50"
                disabled={
                  savingHandicap ||
                  !newHandicap ||
                  isNaN(parseFloat(newHandicap))
                }
              >
                {savingHandicap ? "Saving..." : "Save & Update"}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              ⚠️ This updates the member's permanent handicap index (single
              source of truth)
            </p>
          </div>
        </div>
      )}

      {/* Stale Handicap Warning Modal */}
      {showStaleWarning && (
        <StaleHandicapWarning
          staleMembers={staleMembers}
          onProceed={proceedToOpenScoring}
          onCancel={cancelOpenScoring}
        />
      )}
    </div>
  );
}
