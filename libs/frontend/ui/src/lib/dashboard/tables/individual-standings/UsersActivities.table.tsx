import { DatesRange } from '@box-fc/frontend/domain';
import { useMobileQuery, useUsersQuery } from '@box-fc/frontend/query';
import { UserActivity } from '@box-fc/shared/types';
import { Tab, TabList, useDisclosure } from '@chakra-ui/react';
import { useState } from 'react';
import { SearchInput } from '../../../utils/search/SearchInput';
import { TablePanel } from '../../../utils/table-panel/TablePanel';
import { TabPanels } from '../../../utils/tabs/TabPanels';
import { Tabs } from '../../../utils/tabs/Tabs';
import { UserActivityModal } from './UserActivity.modal';

export const UsersActivitiesTable = () => {
    const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
    const { users } = useUsersQuery();
    const { isMobile } = useMobileQuery();

    const [selectedActivity, setSelectedActivity] = useState<UserActivity | null>(null);
    const [selectedRange, setSelectedRange] = useState<DatesRange | null>(null);
    const [filter, setFilter] = useState<string>('');

    const TITLE = 'Individual standings';
    const DEFAULT_TAB_PANEL_PROPS = {
        users,
        selectActivity: setSelectedActivity,
        selectRange: setSelectedRange,
        filter,
        showDetails: onDetailsOpen,
        isMobile,
    };

    return (
        <>
            {isDetailsOpen && (
                <UserActivityModal
                    onClose={onDetailsClose}
                    isOpen={isDetailsOpen}
                    activity={selectedActivity as UserActivity}
                    range={selectedRange as DatesRange}
                    users={users}
                />
            )}
            <TablePanel>
                <SearchInput handleChange={setFilter} />

                <Tabs>
                    <TabList>
                        <Tab>Week I</Tab>
                        <Tab>Week II</Tab>
                        <Tab>Week III</Tab>
                        <Tab>Week IV</Tab>
                        <Tab>Week V</Tab>
                    </TabList>
                    <TabPanels>
                        {/*<TabPanel {...TabPanelDefaultProps}>*/}
                        {/*    <WeeklyUsersActivities week={WEEKS['1']} {...DEFAULT_TAB_PANEL_PROPS} />*/}
                        {/*</TabPanel>*/}

                        {/*<TabPanel {...TabPanelDefaultProps}>*/}
                        {/*    <WeeklyUsersActivities week={WEEKS['2']} {...DEFAULT_TAB_PANEL_PROPS} />*/}
                        {/*</TabPanel>*/}

                        {/*<TabPanel {...TabPanelDefaultProps}>*/}
                        {/*    <WeeklyUsersActivities week={WEEKS['3']} {...DEFAULT_TAB_PANEL_PROPS} />*/}
                        {/*</TabPanel>*/}

                        {/*<TabPanel {...TabPanelDefaultProps}>*/}
                        {/*    <WeeklyUsersActivities week={WEEKS['4']} {...DEFAULT_TAB_PANEL_PROPS} />*/}
                        {/*</TabPanel>*/}

                        {/*<TabPanel {...TabPanelDefaultProps}>*/}
                        {/*    <WeeklyUsersActivities week={WEEKS['5']} {...DEFAULT_TAB_PANEL_PROPS} />*/}
                        {/*</TabPanel>*/}
                    </TabPanels>
                </Tabs>
            </TablePanel>
        </>
    );
};
