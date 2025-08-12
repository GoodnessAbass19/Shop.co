"use client";

import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const BusinessInfo = () => {
  return (
    <form className="space-y-12 p-4">
      {/* Legal Representative Details */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-medium text-gray-800 capitalize">
            legal representative details
          </h2>
          <p className="text-sm text-gray-600">
            Please provide the following details of the owner / legal
            representative of your business
          </p>
        </div>

        <div className="grid md:grid-cols-3 grid-cols-2 justify-between items-center gap-5 gap-y-7">
          <div className="space-y-2">
            <Label
              htmlFor="legal_name"
              className="text-sm font-medium text-gray-700 flex items-center justify-between"
            >
              Full Name
              <span className="text-xs text-gray-500">Required</span>
            </Label>
            <Input
              type="text"
              id="legal_name"
              placeholder="Name as on the ID"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="id_type"
              className="text-sm font-medium text-gray-700 flex items-center justify-between"
            >
              Choose ID Type
              <span className="text-xs text-gray-500">Required</span>
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select ID Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aadhaar">Aadhaar</SelectItem>
                <SelectItem value="pan">PAN</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="voter_id">Voter ID</SelectItem>
                <SelectItem value="driving_license">Driving License</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </form>
  );
};

export default BusinessInfo;
