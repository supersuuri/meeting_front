import MainMenu from "@/components/MainMenu";
import GanttHome from "@/components/GanttHome";

const HomePage = () => {
  return (
    <section className="flex size-full flex-col mx-auto gap-10 animate-fade-in mt-10 md:flex-row">
      <div className="flex flex-col w-auto mx-auto md:w-auto">
        <MainMenu />
      </div>
      <div className="w-full mx-auto md:w-3/4">
        <GanttHome />
      </div>
    </section>
  );
};

export default HomePage;