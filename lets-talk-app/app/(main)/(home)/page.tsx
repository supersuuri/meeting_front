import StatusBar from "@/components/StatusBar";
import MainMenu from "@/components/MainMenu";
import GanttChart from "@/components/GanttChart";

const HomePage = () => {
  return (
    <section className="flex size-full flex-row gap-10 animate-fade-in mt-10">
      <MainMenu />
      <GanttChart />
    </section>
  );
};

export default HomePage;
