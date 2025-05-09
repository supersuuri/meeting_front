import MainMenu from "@/components/MainMenu";
import GanttHome from "@/components/GanttHome";

const HomePage = () => {
  return (
    <section className="flex size-full flex-row gap-10 animate-fade-in mt-10">
        <div className="">
            <MainMenu />
        </div>
        <div className="flex flex-col gap-10 w-3/4">
          <GanttHome />
        </div>
    </section>
  );
};

export default HomePage;
