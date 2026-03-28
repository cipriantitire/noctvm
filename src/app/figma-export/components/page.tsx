'use client';

/**
 * /figma-export/components
 *
 * Single-URL capture page for html.to.design — renders every NOCTVM UI
 * component in labeled sections so one Figma capture gets the full library.
 *
 * Dev-only — layout.tsx blocks in production.
 */

import React, { useState } from 'react';
import {
  Button, Badge, GlassPanel, IconButton, Tabs,
  SearchBox, Avatar, AvatarGroup, Chip, ButtonGroup,
  Breadcrumbs, Pagination, Progress, CircularProgress,
  Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter,
  Modal, Popover, PopoverTrigger, PopoverContent,
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle,
  Tooltip, TooltipTrigger, TooltipContent, TooltipProvider,
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Switch, Checkbox, RadioGroup, RadioItem, Slider,
  Field, Input, TextArea,
  Alert, Skeleton, EmptyState, Spinner, Divider, Kbd,
  Listbox, ListboxItem, ListboxSection,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  MessageTree, StoryProgressBar, BottomNav, Sidebar,
  type BottomNavItem, type SidebarItem, type TabItem,
} from '@/components/ui';
import {
  EventsIcon, FeedIcon, VenuesIcon, PocketIcon, UserIcon,
  SearchIcon, BellIcon, CogIcon, MoonIcon,
} from '@/components/icons';

// ─── Section wrapper ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-20">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-white font-[Syne] uppercase tracking-wider">
          {title}
        </h2>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      <div className="flex flex-wrap gap-4 items-start">
        {children}
      </div>
    </section>
  );
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-mono">{label}</p>}
      <div className="flex flex-wrap gap-3 items-center">{children}</div>
    </div>
  );
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const bottomNavItems: BottomNavItem[] = [
  { id: 'events', label: 'Events', icon: <EventsIcon className="w-5 h-5" />, isActive: true },
  { id: 'feed',   label: 'Feed',   icon: <FeedIcon   className="w-5 h-5" /> },
  { id: 'venues', label: 'Venues', icon: <VenuesIcon className="w-5 h-5" /> },
  { id: 'pocket', label: 'Pocket', icon: <PocketIcon className="w-5 h-5" /> },
  { id: 'profile',label: 'Profile',icon: <UserIcon   className="w-5 h-5" /> },
];

const sidebarItems: SidebarItem[] = [
  { id: 'events', label: 'Events', icon: <EventsIcon className="w-5 h-5" />, isActive: true },
  { id: 'feed',   label: 'Feed',   icon: <FeedIcon   className="w-5 h-5" /> },
  { id: 'venues', label: 'Venues', icon: <VenuesIcon className="w-5 h-5" /> },
  { id: 'pocket', label: 'Pocket', icon: <PocketIcon className="w-5 h-5" /> },
  { id: 'profile',label: 'Profile',icon: <UserIcon   className="w-5 h-5" /> },
];

const tabItems: TabItem[] = [
  { id: 'explore',   label: 'Explore' },
  { id: 'following', label: 'Following' },
  { id: 'friends',   label: 'Friends' },
];

const msgTreeNodes = [
  {
    id: '1', authorName: 'djnoctvm', authorHandle: '@djnoctvm',
    authorAvatar: 'https://i.pravatar.cc/150?u=djnoctvm',
    content: 'This track is fire tonight 🔥', timestampStr: '2m ago',
    replies: [
      { id: '2', authorName: 'user2', authorHandle: '@user2', content: 'Agreed, absolute banger', timestampStr: '1m ago' },
    ],
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ComponentsExportPage() {
  const [activeTab, setActiveTab] = useState('explore');

  const [switchVal, setSwitchVal] = useState(false);
  const [checked, setChecked] = useState(false);
  const [radio, setRadio] = useState('a');
  const [sliderVal, setSliderVal] = useState(40);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <TooltipProvider>
      <main className="max-w-[1440px] mx-auto px-16 py-16 space-y-0">

        {/* ── Header ── */}
        <div className="mb-16">
          <p className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-mono mb-2">NOCTVM</p>
          <h1 className="text-5xl font-black text-white font-[Syne] uppercase tracking-tight">Component Library</h1>
          <p className="text-[#8A8A8A] mt-2 text-sm">42 components · Dark system · Violet brand · Glass effects</p>
        </div>

        {/* ─────────────────────────────────────────────────────── BUTTONS */}
        <Section title="Button">
          <Row label="primary">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
          </Row>
          <Row label="secondary">
            <Button variant="secondary" size="sm">Small</Button>
            <Button variant="secondary" size="md">Medium</Button>
            <Button variant="secondary" size="lg">Large</Button>
          </Row>
          <Row label="ghost">
            <Button variant="ghost" size="sm">Ghost</Button>
            <Button variant="ghost" size="md">Ghost</Button>
            <Button variant="ghost" size="lg">Ghost</Button>
          </Row>
          <Row label="outline">
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="outline" size="md">Outline</Button>
            <Button variant="outline" size="lg">Outline</Button>
          </Row>
          <Row label="submit">
            <Button variant="submit" size="sm">Submit</Button>
            <Button variant="submit" size="md">Submit</Button>
            <Button variant="submit" size="lg">Submit</Button>
          </Row>
        </Section>

        {/* ─────────────────────────────────────────────────── ICON BUTTON */}
        <Section title="IconButton">
          <Row label="sm / md / lg">
            <IconButton size="sm"><SearchIcon className="w-4 h-4" /></IconButton>
            <IconButton size="md"><BellIcon className="w-4 h-4" /></IconButton>
            <IconButton size="lg"><CogIcon className="w-5 h-5" /></IconButton>
          </Row>
          <Row label="variants">
            <IconButton variant="ghost"><MoonIcon className="w-4 h-4" /></IconButton>
            <IconButton variant="outline"><SearchIcon className="w-4 h-4" /></IconButton>
            <IconButton variant="solid"><BellIcon className="w-4 h-4" /></IconButton>
          </Row>
        </Section>

        {/* ──────────────────────────────────────────────── BUTTON GROUP */}
        <Section title="ButtonGroup">
          <ButtonGroup>
            <Button variant="outline" size="sm">All</Button>
            <Button variant="outline" size="sm">Events</Button>
            <Button variant="outline" size="sm">Venues</Button>
          </ButtonGroup>
          <ButtonGroup variant="primary">
            <Button variant="primary" size="sm">Day</Button>
            <Button variant="primary" size="sm">Week</Button>
            <Button variant="primary" size="sm">Month</Button>
          </ButtonGroup>
        </Section>

        {/* ──────────────────────────────────────────────────── GLASS PANEL */}
        <Section title="GlassPanel">
          {(['default', 'modal', 'subtle', 'header', 'noise'] as const).map(v => (
            <GlassPanel key={v} variant={v} className="p-6 rounded-2xl w-48">
              <p className="text-[10px] uppercase tracking-widest text-[#8A8A8A] font-mono mb-1">{v}</p>
              <p className="text-white text-sm">Glass Panel</p>
            </GlassPanel>
          ))}
        </Section>

        {/* ──────────────────────────────────────────────────────── BADGE */}
        <Section title="Badge">
          <Row label="genre · featured · outline">
            <Badge variant="genre">Techno</Badge>
            <Badge variant="genre">House</Badge>
            <Badge variant="genre">Ambient</Badge>
            <Badge variant="featured">Featured</Badge>
            <Badge variant="outline">Outline</Badge>
          </Row>
        </Section>

        {/* ────────────────────────────────────────────────────────── CHIP */}
        <Section title="Chip">
          <Row label="solid — default/violet/emerald/gold/red">
            {(['default', 'violet', 'emerald', 'gold', 'red'] as const).map(c => (
              <Chip key={c} variant="solid" color={c}>{c}</Chip>
            ))}
          </Row>
          <Row label="bordered">
            {(['default', 'violet', 'emerald', 'gold', 'red'] as const).map(c => (
              <Chip key={c} variant="bordered" color={c}>{c}</Chip>
            ))}
          </Row>
          <Row label="flat">
            {(['default', 'violet', 'emerald', 'gold', 'red'] as const).map(c => (
              <Chip key={c} variant="flat" color={c}>{c}</Chip>
            ))}
          </Row>
          <Row label="sizes">
            <Chip size="sm" variant="solid" color="violet">Small</Chip>
            <Chip size="md" variant="solid" color="violet">Medium</Chip>
            <Chip size="lg" variant="solid" color="violet">Large</Chip>
          </Row>
          <Row label="dot + removable">
            <Chip isDot variant="flat" color="emerald">Live</Chip>
            <Chip onRemove={() => {}} variant="bordered" color="violet">Removable</Chip>
          </Row>
        </Section>

        {/* ──────────────────────────────────────────────────── AVATAR */}
        <Section title="Avatar">
          <Row label="sizes (initials)">
            {(['sm','md','lg','xl','2xl'] as const).map(s => (
              <Avatar key={s} size={s} fallback="DJ" />
            ))}
          </Row>
          <Row label="ring states">
            {(['none','story-unseen','story-seen','highlight','live'] as const).map(r => (
              <Avatar key={r} size="lg" fallback="N" ring={r} />
            ))}
          </Row>
          <Row label="with image">
            <Avatar size="xl" src="https://i.pravatar.cc/150?u=noctvm1" alt="User 1" />
            <Avatar size="xl" src="https://i.pravatar.cc/150?u=noctvm2" alt="User 2" />
            <Avatar size="xl" src="https://i.pravatar.cc/150?u=noctvm3" alt="User 3" />
          </Row>
        </Section>

        {/* ──────────────────────────────────────────────── AVATAR GROUP */}
        <Section title="AvatarGroup">
          <AvatarGroup
            avatars={[1,2,3,4,5,6].map(i => ({ src: `https://i.pravatar.cc/150?u=${i}`, name: `User ${i}` }))}
            max={4}
          />
        </Section>

        {/* ───────────────────────────────────────────────────── DIVIDER */}
        <Section title="Divider">
          <div className="w-64 flex flex-col gap-4">
            <Divider />
            <Divider label="or" />
            <Divider variant="gradient" />
          </div>
        </Section>

        {/* ──────────────────────────────────────────────────── KBD */}
        <Section title="Kbd">
          <Row>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            <Kbd>Enter</Kbd>
            <Kbd>Escape</Kbd>
            <span className="text-[#8A8A8A] text-sm flex items-center gap-1">Press <Kbd>⌘</Kbd><Kbd>K</Kbd> to search</span>
          </Row>
        </Section>

        {/* ──────────────────────────────────────────────── SEARCH BOX */}
        <Section title="SearchBox">
          <SearchBox placeholder="Search events, venues..." className="w-72" />
          <SearchBox placeholder="Disabled" disabled className="w-72" />
        </Section>

        {/* ───────────────────────────────────────────────────── TABS */}
        <Section title="Tabs">
          <Tabs
            tabs={tabItems}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </Section>

        {/* ─────────────────────────────────────────────── BREADCRUMBS */}
        <Section title="Breadcrumbs">
          <Breadcrumbs items={[
            { label: 'Home', href: '#' },
            { label: 'Events', href: '#' },
            { label: 'Control Club' },
          ]} />
        </Section>

        {/* ──────────────────────────────────────────────── PAGINATION */}
        <Section title="Pagination">
          <Pagination total={10} current={3} onChange={() => {}} />
        </Section>

        {/* ──────────────────────────────────────────────── PROGRESS */}
        <Section title="Progress">
          <div className="flex flex-col gap-4 w-64">
            <Row label="linear">
              <div className="w-64 flex flex-col gap-3">
                <Progress value={30} color="violet" label="Uploading..." />
                <Progress value={65} color="emerald" />
                <Progress value={85} color="gold" />
                <Progress value={100} color="violet" />
              </div>
            </Row>
          </div>
          <Row label="circular">
            <CircularProgress value={30} size="sm" color="violet" />
            <CircularProgress value={65} size="md" color="emerald" />
            <CircularProgress value={85} size="lg" color="gold" />
          </Row>
        </Section>

        {/* ─────────────────────────────────────────────────── SPINNER */}
        <Section title="Spinner">
          <Row label="sizes">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Row>
          <Row label="colors">
            <Spinner size="md" color="violet" />
            <Spinner size="md" color="emerald" />
            <Spinner size="md" color="gold" />
            <Spinner size="md" color="white" />
          </Row>
        </Section>

        {/* ────────────────────────────────────────────── STORY PROGRESS */}
        <Section title="StoryProgressBar">
          <div className="w-72">
            <StoryProgressBar count={5} active={2} progress={0.6} />
          </div>
          <div className="w-72">
            <StoryProgressBar count={3} active={0} progress={1} />
          </div>
        </Section>

        {/* ──────────────────────────────────────────────── FORM: FIELD */}
        <Section title="Field / Input / TextArea">
          <Row label="inputs">
            <Field label="Email">
              <Input placeholder="you@noctvm.app" type="email" />
            </Field>
            <Field label="With error" error="This field is required">
              <Input placeholder="Enter value" error />
            </Field>
            <Field label="Disabled">
              <Input placeholder="Disabled" disabled />
            </Field>
          </Row>
          <Row label="textarea">
            <Field label="Bio">
              <TextArea placeholder="Tell your story..." rows={3} className="w-64" />
            </Field>
          </Row>
        </Section>

        {/* ──────────────────────────────────────────────────── SELECT */}
        <Section title="Select">
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bucuresti">București</SelectItem>
              <SelectItem value="constanta">Constanța</SelectItem>
              <SelectItem value="cluj">Cluj-Napoca</SelectItem>
            </SelectContent>
          </Select>
        </Section>

        {/* ───────────────────────────────────────────────── SWITCH */}
        <Section title="Switch">
          <Row label="off / on">
            <Switch checked={false} onCheckedChange={() => {}} />
            <Switch checked={true} onCheckedChange={() => {}} />
            <Switch checked={switchVal} onCheckedChange={setSwitchVal} />
          </Row>
        </Section>

        {/* ──────────────────────────────────────────────── CHECKBOX */}
        <Section title="Checkbox">
          <Row label="unchecked / checked / indeterminate">
            <Checkbox checked={false} onCheckedChange={() => {}} />
            <Checkbox checked={true} onCheckedChange={() => {}} />
            <Checkbox checked="indeterminate" onCheckedChange={() => {}} />
            <label className="flex items-center gap-2 text-sm text-[#E8E4DF]">
              <Checkbox checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
              I accept the terms
            </label>
          </Row>
        </Section>

        {/* ─────────────────────────────────────────────── RADIO GROUP */}
        <Section title="RadioGroup">
          <RadioGroup value={radio} onValueChange={setRadio} className="flex gap-6">
            <RadioItem value="a" label="Option A" />
            <RadioItem value="b" label="Option B" />
            <RadioItem value="c" label="Option C" />
          </RadioGroup>
        </Section>

        {/* ────────────────────────────────────────────────── SLIDER */}
        <Section title="Slider">
          <div className="w-64 flex flex-col gap-4">
            <Slider value={[sliderVal]} onValueChange={([v]) => setSliderVal(v)} min={0} max={100} />
            <Slider value={[25]} min={0} max={100} disabled />
          </div>
        </Section>

        {/* ──────────────────────────────────────────────── ACCORDION */}
        <Section title="Accordion">
          <Accordion type="single" collapsible className="w-96">
            <AccordionItem value="1">
              <AccordionTrigger>What is NOCTVM?</AccordionTrigger>
              <AccordionContent>
                NOCTVM is a premium nightlife platform for discovering events, venues, and connecting with the underground music scene.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>How do Moonrays work?</AccordionTrigger>
              <AccordionContent>
                Moonrays are NOCTVM&apos;s loyalty points. Earn them by attending events, posting content, and engaging with the community.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Which cities are supported?</AccordionTrigger>
              <AccordionContent>
                Currently București and Constanța, with more cities coming soon.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        {/* ─────────────────────────────────────────────── COLLAPSIBLE */}
        <Section title="Collapsible">
          <Collapsible className="w-72 border border-white/10 rounded-xl p-4">
            <CollapsibleTrigger className="text-white text-sm font-medium w-full text-left">
              Advanced filters ↓
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 text-[#8A8A8A] text-sm">
              Genre · Date range · Price · Venue type · Lineup
            </CollapsibleContent>
          </Collapsible>
        </Section>

        {/* ───────────────────────────────────────────── DROPDOWN MENU */}
        <Section title="DropdownMenu">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="md">Open Menu ↓</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Share</DropdownMenuItem>
              <DropdownMenuItem className="text-red-400">Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Section>

        {/* ───────────────────────────────────────────────── POPOVER */}
        <Section title="Popover">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <p className="text-sm text-[#E8E4DF] font-medium mb-1">Share this event</p>
              <p className="text-xs text-[#8A8A8A]">Copy link or share to social media platforms.</p>
            </PopoverContent>
          </Popover>
        </Section>

        {/* ────────────────────────────────────────────────── TOOLTIP */}
        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>NOCTVM tooltip</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton size="md"><BellIcon className="w-4 h-4" /></IconButton>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </Section>

        {/* ─────────────────────────────────────────────────── SHEET */}
        <Section title="Sheet">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Event Details</SheetTitle>
              </SheetHeader>
              <div className="mt-4 text-[#8A8A8A] text-sm">
                Sheet content — event info, filters, or settings go here.
              </div>
            </SheetContent>
          </Sheet>
        </Section>

        {/* ─────────────────────────────────────────────────── MODAL */}
        <Section title="Modal">
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
            Open Modal
          </Button>
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Confirm Action">
            <p className="text-[#8A8A8A] text-sm">
              Are you sure you want to proceed? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>Confirm</Button>
            </div>
          </Modal>
        </Section>

        {/* ───────────────────────────────────────────────── ALERT */}
        <Section title="Alert">
          <div className="flex flex-col gap-3 w-full max-w-lg">
            <Alert variant="default" title="Info">You have 3 new event recommendations tonight.</Alert>
            <Alert variant="success" title="Success">Your post was shared successfully.</Alert>
            <Alert variant="warning" title="Warning">This venue closes at 05:00.</Alert>
            <Alert variant="error" title="Error">Failed to load event details. Try again.</Alert>
          </div>
        </Section>

        {/* ─────────────────────────────────────────────── SKELETON */}
        <Section title="Skeleton">
          <div className="flex flex-col gap-3 w-72">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <div className="flex gap-3 items-center">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        </Section>

        {/* ──────────────────────────────────────────────── EMPTY STATE */}
        <Section title="EmptyState">
          <EmptyState
            icon="🎵"
            title="No events found"
            description="Try adjusting your filters or check back later for new events."
            action={<Button variant="primary" size="sm">Browse All Events</Button>}
          />
        </Section>

        {/* ─────────────────────────────────────────────── CARD */}
        <Section title="Card">
          <Card className="w-72">
            <CardHeader>
              <CardTitle>Control Club</CardTitle>
              <CardDescription>București · Underground</CardDescription>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-[#8A8A8A]">Iconic underground club hosting the best techno and electronic music events in Romania.</p>
            </CardBody>
            <CardFooter>
              <Button variant="secondary" size="sm">View Events</Button>
              <Button variant="ghost" size="sm">Follow</Button>
            </CardFooter>
          </Card>
          <Card className="w-72">
            <CardHeader>
              <CardTitle>Tonight&apos;s Lineup</CardTitle>
              <CardDescription>Sat 29 Mar · 23:00 → 06:00</CardDescription>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col gap-2">
                {['Admina', 'Chlorys', 'von Bulove'].map(a => (
                  <div key={a} className="flex items-center gap-3">
                    <Avatar size="sm" fallback={a[0]} />
                    <span className="text-sm text-[#E8E4DF]">{a}</span>
                  </div>
                ))}
              </div>
            </CardBody>
            <CardFooter>
              <Button variant="primary" size="sm">Get Tickets</Button>
            </CardFooter>
          </Card>
        </Section>

        {/* ─────────────────────────────────────────────── LISTBOX */}
        <Section title="Listbox">
          <Listbox className="w-56">
            <ListboxSection title="Genre">
              <ListboxItem value="techno">Techno</ListboxItem>
              <ListboxItem value="house">House</ListboxItem>
              <ListboxItem value="ambient">Ambient</ListboxItem>
            </ListboxSection>
            <ListboxSection title="City">
              <ListboxItem value="bucuresti">București</ListboxItem>
              <ListboxItem value="constanta">Constanța</ListboxItem>
            </ListboxSection>
          </Listbox>
        </Section>

        {/* ─────────────────────────────────────────────── TABLE */}
        <Section title="Table">
          <div className="w-full max-w-2xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Genre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { event: 'Admina & Chlorys', venue: 'Control Club', date: 'Mar 08', genre: 'Techno' },
                  { event: 'Ladies Night', venue: 'OXYA Club', date: 'Mar 08', genre: 'Party' },
                  { event: 'Vlad Flueraru', venue: 'Control Club', date: 'Mar 14', genre: 'Ambient' },
                ].map(row => (
                  <TableRow key={row.event}>
                    <TableCell className="font-medium text-white">{row.event}</TableCell>
                    <TableCell>{row.venue}</TableCell>
                    <TableCell>{row.date}</TableCell>
                    <TableCell><Badge variant="genre">{row.genre}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Section>

        {/* ──────────────────────────────────────────── MESSAGE TREE */}
        <Section title="MessageTree">
          <div className="w-96">
            <MessageTree data={msgTreeNodes} onReply={() => {}} />
          </div>
        </Section>

        {/* ──────────────────────────────────────────── BOTTOM NAV */}
        <Section title="BottomNav">
          <div className="relative w-[390px] h-20">
            <BottomNav items={bottomNavItems} />
          </div>
        </Section>

        {/* ─────────────────────────────────────────────── SIDEBAR */}
        <Section title="Sidebar (Desktop)">
          <div className="relative w-[240px] h-[500px] border border-white/10 rounded-2xl overflow-hidden">
            <Sidebar items={sidebarItems} />
          </div>
        </Section>

      </main>
    </TooltipProvider>
  );
}
