'use client';
import React, { useState, useEffect } from "react";
import TeamGanttChart from "./TeamGanttChart";

const GanttHome: React.FC = () => {
    const [teamId, setTeamId] = useState("");
    const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/users/teamID");
                const data = await response.json();
                setTeams(data);
            } catch (error) {
                console.error("Error fetching teams:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setTeamId(event.target.value);
    };

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">Team Gantt Chart</h1>
                    <div className="mb-6">
                        <select
                            id="teamSelect"
                            value={teamId}
                            onChange={handleSelectChange}
                            disabled={isLoading}
                            className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled>
                                {isLoading ? "Loading teams..." : "Select a team"}
                            </option>
                            {teams.map((team) => (
                                <option key={team.id} value={team.id}>
                                    {team.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    {teamId ? (
                        <TeamGanttChart teamId={teamId} />
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-500">Please select a team to view the Gantt chart</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GanttHome;