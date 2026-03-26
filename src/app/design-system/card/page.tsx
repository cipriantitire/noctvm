'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function CardPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Card</h1>
        <p className="text-noctvm-silver">Composable card with Header, Body, and Footer slots.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Event Tonight</CardTitle>
            <CardDescription>Prism Berlin · 11 PM – 8 AM</CardDescription>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-noctvm-silver">Techno, Acid, Industrial. Berghain residents + international guests.</p>
          </CardBody>
          <CardFooter>
            <Button size="sm" variant="primary">Get tickets</Button>
            <Button size="sm" variant="ghost">Save</Button>
          </CardFooter>
        </Card>
        <Card variant="glass">
          <CardHeader>
            <CardTitle>VIP Table</CardTitle>
            <CardDescription>Fabric London · Table 4</CardDescription>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between">
              <span className="text-sm text-noctvm-silver">Bottle service included</span>
              <Badge variant="featured">£450</Badge>
            </div>
          </CardBody>
          <CardFooter className="border-t border-white/10 pt-3 mt-3">
            <Button size="sm" variant="primary" className="flex-1">Reserve</Button>
          </CardFooter>
        </Card>
        <Card variant="bordered" isHoverable>
          <CardHeader>
            <CardTitle>Bordered + Hoverable</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-noctvm-silver">Hover to see the border highlight.</p>
          </CardBody>
        </Card>
        <Card variant="flat" isPressable>
          <CardBody>
            <p className="text-sm text-white font-medium">Flat + Pressable</p>
            <p className="text-noctvm-caption text-noctvm-silver mt-1">Click to see the press scale effect.</p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
