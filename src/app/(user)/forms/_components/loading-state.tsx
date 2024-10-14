import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingState() {
  return (
    <div className="flex-1 px-10 md:px-10 lg:px-20 mx-auto min-h-[calc(100vh-3.6rem)] flex flex-col">
      <div className="flex justify-start w-full pt-4">
        <Skeleton className="h-6 w-24" />
      </div>
      <div className="bg-white w-full rounded-lg pt-8 mb-14 md:w-[90%]">
        <Skeleton className="h-12 w-3/4 mb-2" />
        <div className="h-px bg-gray-200 w-full mb-2"></div>
        <Skeleton className="h-8 w-1/2" />
      </div>
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white py-6 px-4 relative lg:w-[80%] border rounded-lg border-gray-200"
          >
            <div className="flex items-center w-full mb-4">
              <Skeleton className="h-6 w-6 mr-2" />
              <Skeleton className="h-8 flex-grow" />
              <Skeleton className="h-8 w-8 ml-2" />
            </div>
            <div className="flex gap-x-4 items-center mt-2 ml-8">
              <Skeleton className="h-10 w-[200px] md:w-[300px]" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="ml-8 w-full md:w-[400px] lg:w-[500px] mt-4">
              <Skeleton className="h-6 w-32 mb-2" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center">
                    <Skeleton className="h-8 w-8 mr-2" />
                    <Skeleton className="h-8 flex-grow mr-2" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
