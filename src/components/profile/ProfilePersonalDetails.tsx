import React, { useState } from 'react';
import { Loader2, Save, Plus, Trash2, Globe, Briefcase, GraduationCap, Award } from 'lucide-react';

const InstagramIcon = ({ size = 20, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const YoutubeIcon = ({ size = 20, ...props }: { size?: number } & React.SVGProps<SVGSVGElement>) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
  </svg>
);

interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
}

interface EducationItem {
  school: string;
  degree: string;
  year: string;
}

interface PersonalForm {
  name: string;
  phone: string;
  bio: string;
  skills: string[];
  social_links: {
    instagram: string;
    youtube: string;
    website: string;
  };
  experience: ExperienceItem[];
  education: EducationItem[];
}

interface ProfilePersonalDetailsProps {
  readonly email: string;
  readonly personalForm: PersonalForm;
  readonly setPersonalForm: React.Dispatch<React.SetStateAction<PersonalForm>>;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
  readonly loading: boolean;
}

export default function ProfilePersonalDetails({
  email,
  personalForm,
  setPersonalForm,
  onSubmit,
  loading,
}: ProfilePersonalDetailsProps) {
  const [skillInput, setSkillInput] = useState('');

  // Experience handlers
  const addExperience = () => {
    const updated = [
      ...personalForm.experience,
      { title: '', company: '', duration: '', description: '' },
    ];
    setPersonalForm({ ...personalForm, experience: updated });
  };

  const removeExperience = (index: number) => {
    const updated = personalForm.experience.filter((_, i) => i !== index);
    setPersonalForm({ ...personalForm, experience: updated });
  };

  const handleExperienceChange = (index: number, field: keyof ExperienceItem, value: string) => {
    const updated = personalForm.experience.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setPersonalForm({ ...personalForm, experience: updated });
  };

  // Education handlers
  const addEducation = () => {
    const updated = [
      ...personalForm.education,
      { school: '', degree: '', year: '' },
    ];
    setPersonalForm({ ...personalForm, education: updated });
  };

  const removeEducation = (index: number) => {
    const updated = personalForm.education.filter((_, i) => i !== index);
    setPersonalForm({ ...personalForm, education: updated });
  };

  const handleEducationChange = (index: number, field: keyof EducationItem, value: string) => {
    const updated = personalForm.education.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setPersonalForm({ ...personalForm, education: updated });
  };

  // Skill handlers
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!personalForm.skills.includes(skillInput.trim())) {
        setPersonalForm({
          ...personalForm,
          skills: [...personalForm.skills, skillInput.trim()],
        });
      }
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setPersonalForm({
      ...personalForm,
      skills: personalForm.skills.filter(s => s !== skillToRemove),
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white border border-[#EBE6E0] rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#2D2A26] mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="profile-fullname" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              id="profile-fullname"
              required
              type="text"
              value={personalForm.name}
              onChange={e => setPersonalForm({ ...personalForm, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm transition-all"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-email" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                id="profile-email"
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 bg-[#F0EAE3] border border-[#EBE6E0] rounded-xl text-[#A8A19A] cursor-not-allowed text-sm outline-none"
              />
              <p className="text-[10px] text-[#A8A19A] mt-1.5">Email cannot be changed.</p>
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                id="profile-phone"
                type="text"
                value={personalForm.phone}
                onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm transition-all"
              />
            </div>
          </div>
 
          <div>
            <label htmlFor="profile-bio" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-1.5">Design Bio</label>
            <textarea
              id="profile-bio"
              value={personalForm.bio}
              onChange={e => setPersonalForm({ ...personalForm, bio: e.target.value })}
              rows={3}
              placeholder="Tell clients about your design style and tailoring philosophy..."
              className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Skills / Specializations */}
      <div className="bg-white border border-[#EBE6E0] rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#2D2A26] mb-1 flex items-center gap-2">
          <Award size={20} className="text-[#8C6B5D]" />
          Specializations & Skills
        </h2>
        <p className="text-xs text-[#827A73] mb-4">What types of garments or services do you specialize in?</p>
        
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="Type a skill (e.g. Bespoke Suits) and press Enter"
              className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {personalForm.skills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF6F3] border border-[#EBE6E0] rounded-full text-xs font-medium text-[#524A44]"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="text-[#A8A19A] hover:text-[#B26959] transition-colors font-bold text-sm"
                >
                  &times;
                </button>
              </span>
            ))}
            {personalForm.skills.length === 0 && (
              <p className="text-xs text-[#A8A19A] italic">No specializations added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Social & Portfolio Links */}
      <div className="bg-white border border-[#EBE6E0] rounded-3xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#2D2A26] mb-4 flex items-center gap-2">
          <Globe size={20} className="text-[#8C6B5D]" />
          Portfolio & Socials
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[#A8A19A] w-5 text-right"><InstagramIcon size={18} /></span>
            <input
              type="text"
              value={personalForm.social_links.instagram}
              onChange={e => setPersonalForm({
                ...personalForm,
                social_links: { ...personalForm.social_links, instagram: e.target.value }
              })}
              placeholder="Instagram Profile URL"
              className="flex-1 px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#A8A19A] w-5 text-right"><YoutubeIcon size={18} /></span>
            <input
              type="text"
              value={personalForm.social_links.youtube}
              onChange={e => setPersonalForm({
                ...personalForm,
                social_links: { ...personalForm.social_links, youtube: e.target.value }
              })}
              placeholder="YouTube Channel URL"
              className="flex-1 px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#A8A19A] w-5 text-right"><Globe size={18} /></span>
            <input
              type="text"
              value={personalForm.social_links.website}
              onChange={e => setPersonalForm({
                ...personalForm,
                social_links: { ...personalForm.social_links, website: e.target.value }
              })}
              placeholder="Portfolio Website URL"
              className="flex-1 px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Work & Experience */}
      <div className="bg-white border border-[#EBE6E0] rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#2D2A26] flex items-center gap-2">
            <Briefcase size={20} className="text-[#8C6B5D]" />
            Work & Experience
          </h2>
          <button
            type="button"
            onClick={addExperience}
            className="text-xs font-semibold text-[#8C6B5D] hover:text-[#72564A] flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Add Experience
          </button>
        </div>

        <div className="space-y-6">
          {personalForm.experience.map((exp, idx) => (
            <div key={`exp-${exp.company}-${exp.title}-${idx}`} className="p-4 bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl relative space-y-4">
              <button
                type="button"
                onClick={() => removeExperience(idx)}
                className="absolute top-4 right-4 text-[#A8A19A] hover:text-[#B26959] transition-colors"
              >
                <Trash2 size={16} />
              </button>
 
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`exp-title-${idx}`} className="block text-[10px] font-bold text-[#524A44] uppercase tracking-wider mb-1">Job Title</label>
                  <input
                    id={`exp-title-${idx}`}
                    required
                    type="text"
                    placeholder="e.g., Master Tailor"
                    value={exp.title}
                    onChange={e => handleExperienceChange(idx, 'title', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`exp-company-${idx}`} className="block text-[10px] font-bold text-[#524A44] uppercase tracking-wider mb-1">Shop / Company Name</label>
                  <input
                    id={`exp-company-${idx}`}
                    required
                    type="text"
                    placeholder="e.g., House of Suits"
                    value={exp.company}
                    onChange={e => handleExperienceChange(idx, 'company', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm"
                  />
                </div>
              </div>
 
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`exp-duration-${idx}`} className="block text-[10px] font-bold text-[#524A44] uppercase tracking-wider mb-1">Duration</label>
                  <input
                    id={`exp-duration-${idx}`}
                    required
                    type="text"
                    placeholder="e.g., 2021 - Present"
                    value={exp.duration}
                    onChange={e => handleExperienceChange(idx, 'duration', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`exp-description-${idx}`} className="block text-[10px] font-bold text-[#524A44] uppercase tracking-wider mb-1">Brief Description</label>
                  <input
                    id={`exp-description-${idx}`}
                    type="text"
                    placeholder="e.g., Handcrafted bespoke menswear suits."
                    value={exp.description}
                    onChange={e => handleExperienceChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          ))}

          {personalForm.experience.length === 0 && (
            <p className="text-xs text-[#A8A19A] italic text-center py-4">No work experience added yet.</p>
          )}
        </div>
      </div>

      {/* Education & Certifications */}
      <div className="bg-white border border-[#EBE6E0] rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[#2D2A26] flex items-center gap-2">
            <GraduationCap size={20} className="text-[#8C6B5D]" />
            Education & Certifications
          </h2>
          <button
            type="button"
            onClick={addEducation}
            className="text-xs font-semibold text-[#8C6B5D] hover:text-[#72564A] flex items-center gap-1.5 transition-colors"
          >
            <Plus size={14} /> Add Education
          </button>
        </div>

        <div className="space-y-6">
          {personalForm.education.map((edu, idx) => (
            <div key={`edu-${edu.school}-${edu.degree}-${idx}`} className="p-4 bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl relative space-y-4">
              <button
                type="button"
                onClick={() => removeEducation(idx)}
                className="absolute top-4 right-4 text-[#A8A19A] hover:text-[#B26959] transition-colors"
              >
                <Trash2 size={16} />
              </button>
 
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor={`edu-school-${idx}`} className="block text-[10px] font-bold text-[#524A44] uppercase tracking-wider mb-1">School / Institution</label>
                  <input
                    id={`edu-school-${idx}`}
                    required
                    type="text"
                    placeholder="e.g., STI College Davao"
                    value={edu.school}
                    onChange={e => handleEducationChange(idx, 'school', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`edu-year-${idx}`} className="block text-[10px] font-bold text-[#524A44] uppercase tracking-wider mb-1">Year Graduated</label>
                  <input
                    id={`edu-year-${idx}`}
                    required
                    type="text"
                    placeholder="e.g., 2023"
                    value={edu.year}
                    onChange={e => handleEducationChange(idx, 'year', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm"
                  />
                </div>
              </div>
 
              <div>
                <label htmlFor={`edu-degree-${idx}`} className="block text-[10px] font-bold text-[#524A44] uppercase tracking-wider mb-1">Degree / Course / Certification</label>
                <input
                  id={`edu-degree-${idx}`}
                  required
                  type="text"
                  placeholder="e.g., BS in Fashion Design & Technology"
                  value={edu.degree}
                  onChange={e => handleEducationChange(idx, 'degree', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] outline-none text-sm"
                />
              </div>
            </div>
          ))}

          {personalForm.education.length === 0 && (
            <p className="text-xs text-[#A8A19A] italic text-center py-4">No education details added yet.</p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#8C6B5D] hover:bg-[#72564A] text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
          Save Changes
        </button>
      </div>
    </form>
  );
}
