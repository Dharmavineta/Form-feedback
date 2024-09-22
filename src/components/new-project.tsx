import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

const NewProjectDialog = () => {
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button size={"sm"} className="flex gap-x-2">
            <Plus className="w-4 h-4" />
            Create New Project
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white sm:max-w-[420px] rounded-md">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new form to get started
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Project Name" />
            </div>
            <div>
              <Label htmlFor="url">URL</Label>
              <Input id="name" placeholder="https://www.yoursite.com" />
            </div>
            <div>
              <Label htmlFor="desc"></Label>
              <Textarea
                id="desc"
                placeholder="Description of the form(optional)"
              />
            </div>
          </form>
          <DialogFooter>
            <Button>Create Form</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewProjectDialog;
